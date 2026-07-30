import { ExpectedError } from 'erxes-api-shared/utils';
import { canGroup, getGroupActionScope } from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { prepareChatTurn, persistTurn, runAgentTurn } from '@/agent/turn';
import {
  canUserAccessAgent,
  getAgentQuotaStatus,
  getUserUnitIds,
} from '@/agent/utils';
import { IMastraAgentDocument } from '@/agent/@types/agent';
import { requireActionScope } from '@/_shared/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

export const agentQueries = {
  mastraAgents: async (
    _parent: undefined,
    _args: undefined,
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    const [scope, unitIds] = await Promise.all([
      checkPermission(ERXES_AGENT_ACTIONS.agent.readSummary).then(() =>
        requireActionScope({
          subdomain,
          user,
          action: ERXES_AGENT_ACTIONS.agent.readSummary,
        }),
      ),
      user?._id
        ? getUserUnitIds(models, user._id)
        : Promise.resolve<string[]>([]),
    ]);
    return models.MastraAgent.getAgents(
      user?._id,
      scope,
      user?.branchIds ?? [],
      user?.departmentIds ?? [],
      unitIds,
    );
  },

  mastraAgent: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    const [scope, unitIds] = await Promise.all([
      checkPermission(ERXES_AGENT_ACTIONS.agent.readConfig).then(() =>
        requireActionScope({
          subdomain,
          user,
          action: ERXES_AGENT_ACTIONS.agent.readConfig,
        }),
      ),
      user?._id
        ? getUserUnitIds(models, user._id)
        : Promise.resolve<string[]>([]),
    ]);
    return models.MastraAgent.getAgent(
      _id,
      user?._id,
      scope,
      user?.branchIds ?? [],
      user?.departmentIds ?? [],
      unitIds,
    );
  },

  mastraAgentsMain: async (
    _parent: undefined,
    params: { page?: number; perPage?: number; searchValue?: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    const [scope, unitIds] = await Promise.all([
      checkPermission(ERXES_AGENT_ACTIONS.agent.readSummary).then(() =>
        requireActionScope({
          subdomain,
          user,
          action: ERXES_AGENT_ACTIONS.agent.readSummary,
        }),
      ),
      user?._id
        ? getUserUnitIds(models, user._id)
        : Promise.resolve<string[]>([]),
    ]);
    return models.MastraAgent.getAgentsList({
      ...params,
      userId: user?._id,
      scope,
      teamIds: user?.branchIds ?? [],
      deptIds: user?.departmentIds ?? [],
      unitIds,
    });
  },

  mastraMyAgentQuotaStatus: async (
    _parent: undefined,
    _args: undefined,
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.create);
    if (!user?._id) throw new ExpectedError('Login required');
    const scope = await requireActionScope({
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.create,
    });
    if (scope === 'all') return { count: 0, quota: 0, atQuota: false };
    return getAgentQuotaStatus(models, user._id);
  },

  mastraAgentChat: async (
    _parent: undefined,
    {
      agentId,
      message,
      threadId,
    }: { agentId: string; message: string; threadId?: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    if (!user?._id) throw new ExpectedError('Login required');

    const prepared = await prepareChatTurn({
      models,
      subdomain,
      user,
      agentId,
      message,
      threadId,
    });

    const { agent, convo, authCtx, memoryBinding } = prepared;
    const reply = await runAgentTurn({
      agent,
      convo,
      message,
      authCtx,
      memory: memoryBinding,
    });

    await persistTurn({ models, prepared, reply });

    return reply;
  },
};

const capabilityActions = [
  ERXES_AGENT_ACTIONS.agent.readConfig,
  ERXES_AGENT_ACTIONS.agent.chat,
  ERXES_AGENT_ACTIONS.agent.update,
  ERXES_AGENT_ACTIONS.agent.remove,
  ERXES_AGENT_ACTIONS.agent.share,
  ERXES_AGENT_ACTIONS.agent.transferOwnership,
  ERXES_AGENT_ACTIONS.workflow.read,
  ERXES_AGENT_ACTIONS.skills.read,
  ERXES_AGENT_ACTIONS.learning.read,
] as const;

const emptyCapabilities = {
  canReadConfig: false,
  canChat: false,
  canEdit: false,
  canRemove: false,
  canShare: false,
  canTransferOwnership: false,
  canManageGrant: false,
  canReadWorkflows: false,
  canReadSkills: false,
  canReadLearnings: false,
};

export const agentCustomResolvers = {
  MastraAgent: {
    isOwnAgent: (
      agent: IMastraAgentDocument,
      _args: unknown,
      { user }: IContext,
    ) => Boolean(user?._id && agent.createdBy === user._id),

    capabilities: async (
      agent: IMastraAgentDocument,
      _args: unknown,
      { models, subdomain, user }: IContext,
    ) => {
      if (!user?._id) return emptyCapabilities;

      const [unitIds, actionScopes, canManagePermissions] = await Promise.all([
        getUserUnitIds(models, user._id),
        Promise.all(
          capabilityActions.map((action) =>
            getGroupActionScope(subdomain, action, user),
          ),
        ),
        Promise.all([
          canGroup(subdomain, 'permissionsManage', user),
          canGroup(subdomain, 'permissionsAgentProfilesManage', user),
        ]).then((permissions) => permissions.some(Boolean)),
      ]);
      const allowed = actionScopes.map((scope) =>
        scope
          ? canUserAccessAgent(
              agent,
              user._id,
              scope,
              user.branchIds ?? [],
              user.departmentIds ?? [],
              unitIds,
            )
          : false,
      );

      return {
        canReadConfig: allowed[0],
        canChat: allowed[1],
        canEdit: allowed[2],
        canRemove: allowed[3],
        canShare: allowed[4],
        canTransferOwnership: actionScopes[5] === 'all' && Boolean(allowed[5]),
        canManageGrant: canManagePermissions && Boolean(allowed[2]),
        canReadWorkflows: allowed[6],
        canReadSkills: allowed[7],
        canReadLearnings: allowed[8],
      };
    },

    workflowsCount: async (
      agent: IMastraAgentDocument,
      _args: unknown,
      { models }: IContext,
    ) =>
      agent.agentId
        ? await models.MastraWorkflow.countDocuments({
            agentId: agent.agentId,
          })
        : 0,
  },
};
