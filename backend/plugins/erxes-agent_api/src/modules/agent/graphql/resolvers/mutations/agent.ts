import { ExpectedError, sendTRPCMessage } from 'erxes-api-shared/utils';
import { canGroup } from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { IMastraAgent } from '@/agent/@types/agent';
import { getAgentQuotaStatus } from '@/agent/utils';
import { requireScopedAgent } from '@/agent/authorization';
import { requireActionScope } from '@/_shared/authorization';
import {
  deactivateServiceUser,
  syncServiceUserGroup,
} from '~/mastra/auth/servicePrincipal';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';
import { toUserFacingAgentError } from './agentErrors';

interface CoreGroup {
  _id: string;
  principalType?: string;
}

interface CoreUser {
  _id: string;
}

const fetchGrantGroup = async (
  subdomain: string,
  groupId: string,
): Promise<CoreGroup> => {
  const groups = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'permissionGroups',
    action: 'find',
    method: 'query',
    input: { query: { _id: groupId } },
    defaultValue: [],
  });
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new ExpectedError(
      `Permission group "${groupId}" was not found — pick an existing group from Settings → Permissions.`,
    );
  }
  const group = groups[0] as CoreGroup;
  if (group.principalType !== 'agent') {
    throw new ExpectedError('Agents may only use agent grant profiles');
  }
  return group;
};

export const agentMutations = {
  mastraAgentCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraAgent },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.create);
    if (!user?._id) throw new ExpectedError('Login required');

    const scope = await requireActionScope({
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.create,
    });
    const visibility = doc.visibility ?? 'private';

    if (visibility !== 'private') {
      await checkPermission(ERXES_AGENT_ACTIONS.agent.share);
      const shareScope = await requireActionScope({
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.agent.share,
      });
      if (shareScope !== 'all') {
        throw new ExpectedError(
          'Creating a shared agent requires all-agent sharing permission',
        );
      }
    }
    if (
      doc.createdBy !== undefined ||
      doc.serviceUserId !== undefined ||
      doc.grantGroupId !== undefined
    ) {
      throw new ExpectedError(
        'Agent ownership and grants use dedicated security actions',
      );
    }

    if (scope !== 'all') {
      const status = await getAgentQuotaStatus(models, user._id);
      if (status.atQuota) {
        throw new ExpectedError(`Agent quota reached (${status.quota})`);
      }
    }

    try {
      return await models.MastraAgent.createAgent({
        ...doc,
        visibility,
        createdBy: user._id,
      });
    } catch (error) {
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: Partial<IMastraAgent> },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.update);
    if (!user?._id) throw new ExpectedError('Login required');

    const {
      agentId,
      createdBy,
      serviceUserId,
      grantGroupId,
      visibility,
      teamId,
      departmentId,
      unitId,
      ...config
    } = doc;

    if (
      agentId !== undefined ||
      createdBy !== undefined ||
      serviceUserId !== undefined ||
      grantGroupId !== undefined ||
      visibility !== undefined ||
      teamId !== undefined ||
      departmentId !== undefined ||
      unitId !== undefined
    ) {
      throw new ExpectedError(
        'Agent identity, audience, ownership, and grants use dedicated security actions',
      );
    }

    const { agent } = await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.update,
      agentId: _id,
    });

    try {
      return await models.MastraAgent.updateAgent(_id, config, agent.createdBy);
    } catch (error) {
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentSetAudience: async (
    _parent: undefined,
    {
      _id,
      visibility,
      teamId,
      departmentId,
      unitId,
    }: {
      _id: string;
      visibility: 'private' | 'team' | 'department' | 'unit' | 'org';
      teamId?: string;
      departmentId?: string;
      unitId?: string;
    },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.share);
    if (!user?._id) throw new ExpectedError('Login required');

    if (visibility === 'team' && !teamId) {
      throw new ExpectedError('A team is required for team visibility');
    }
    if (visibility === 'department' && (!teamId || !departmentId)) {
      throw new ExpectedError(
        'A team and department are required for department visibility',
      );
    }
    if (visibility === 'unit' && (!teamId || !departmentId || !unitId)) {
      throw new ExpectedError(
        'A team, department, and unit are required for unit visibility',
      );
    }

    const { agent } = await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.share,
      agentId: _id,
    });

    return models.MastraAgent.updateAgent(
      _id,
      {
        visibility,
        teamId:
          visibility === 'team' ||
          visibility === 'department' ||
          visibility === 'unit'
            ? teamId
            : null,
        departmentId:
          visibility === 'department' || visibility === 'unit'
            ? departmentId
            : null,
        unitId: visibility === 'unit' ? unitId : null,
      },
      agent.createdBy,
    );
  },

  mastraAgentTransferOwnership: async (
    _parent: undefined,
    { _id, newOwnerUserId }: { _id: string; newOwnerUserId: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.transferOwnership);
    if (!user?._id) throw new ExpectedError('Login required');

    const { agent, scope } = await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.transferOwnership,
      agentId: _id,
    });
    if (scope !== 'all') {
      throw new ExpectedError('Ownership transfer requires all-agent scope');
    }

    const owner = (await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'users',
      action: 'findOne',
      method: 'query',
      input: { query: { _id: newOwnerUserId, isActive: { $ne: false } } },
      defaultValue: null,
    })) as CoreUser | null;
    if (!owner?._id) throw new ExpectedError('Owner user not found');

    return models.MastraAgent.updateAgent(
      _id,
      { createdBy: owner._id },
      agent.createdBy,
    );
  },

  mastraAgentSetGrant: async (
    _parent: undefined,
    {
      _id,
      grantGroupId: requestedGroupId,
    }: { _id: string; grantGroupId?: string | null },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    const canManageGrant =
      (await canGroup(subdomain, 'permissionsAgentProfilesManage', user)) ||
      (await canGroup(subdomain, 'permissionsManage', user));
    if (!canManageGrant) throw new ExpectedError('Permission required');
    await checkPermission(ERXES_AGENT_ACTIONS.agent.update);
    if (!user?._id) throw new ExpectedError('Login required');
    const grantGroupId = requestedGroupId?.trim() || null;

    const { agent } = await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.update,
      agentId: _id,
    });
    if (grantGroupId) {
      await fetchGrantGroup(subdomain, grantGroupId);
    }

    if (agent.serviceUserId) {
      await syncServiceUserGroup({
        serviceUserId: agent.serviceUserId,
        groupId: grantGroupId,
        subdomain,
      });
    }

    return models.MastraAgent.updateAgent(
      _id,
      { grantGroupId },
      agent.createdBy,
    );
  },

  mastraAgentRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.remove);
    if (!user?._id) throw new ExpectedError('Login required');

    const { agent } = await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.remove,
      agentId: _id,
    });

    if (agent.serviceUserId) {
      try {
        await deactivateServiceUser({
          serviceUserId: agent.serviceUserId,
          subdomain,
        });
      } catch (error) {
        console.error(
          `Failed to deactivate service user for agent ${_id}:`,
          error,
        );
      }
    }

    return models.MastraAgent.removeAgent(_id, agent.createdBy);
  },
};
