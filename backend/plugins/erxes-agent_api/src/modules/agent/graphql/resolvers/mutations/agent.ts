import { ExpectedError } from 'erxes-api-shared/utils';
import type {
  ICustomPermission,
  IUserDocument,
  PermissionScope,
} from 'erxes-api-shared/core-types';
import { IContext } from '~/connectionResolvers';
import type {
  IMastraAgent,
  IMastraAgentDocument,
  IMastraAgentInput,
  MastraAgentPermissionMode,
} from '@/agent/@types/agent';
import { requireScopedAgent } from '@/agent/authorization';
import { requireActionScope } from '@/_shared/authorization';
import {
  AgentAccount,
  createAgentAccount,
  deactivateAgentAccount,
  updateAgentAccount,
} from '~/mastra/auth/servicePrincipal';
import { resolveAgentPermissions } from '~/mastra/tools/permissionCapabilities';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';
import { toUserFacingAgentError } from './agentErrors';
import { normalizeAdditionalToolKeys } from '~/mastra/tools/additionalTools';

const assertPermissionGroupsExist = async (
  subdomain: string,
  permissionGroupIds: string[],
): Promise<string[]> => {
  const normalized = [
    ...new Set(permissionGroupIds.map((id) => id.trim()).filter(Boolean)),
  ];
  const { foundGroupIds } = await resolveAgentPermissions({
    subdomain,
    permissionGroupIds: normalized,
  });
  const missing = normalized.filter((id) => !foundGroupIds.includes(id));
  if (missing.length) {
    throw new ExpectedError(
      `Permission group${
        missing.length > 1 ? 's' : ''
      } not found: ${missing.join(', ')}`,
    );
  }
  return normalized;
};

interface AgentGrant {
  permissionGroupIds: string[];
  customPermissions: ICustomPermission[];
  mode: MastraAgentPermissionMode;
}

const resolveAgentGrant = async (
  subdomain: string,
  user: IUserDocument,
  requestedGroupIds: string[],
  actionScope: PermissionScope,
): Promise<AgentGrant> => {
  const permissionGroupIds = await assertPermissionGroupsExist(
    subdomain,
    requestedGroupIds,
  );
  if (actionScope === 'all') {
    if (!permissionGroupIds.length) {
      throw new ExpectedError(
        'Select at least one permission group for this AI team member.',
      );
    }
    return {
      permissionGroupIds,
      customPermissions: [],
      mode: 'managed',
    };
  }

  const assignedGroupIds = new Set(user.permissionGroupIds ?? []);
  const elevated = permissionGroupIds.filter(
    (groupId) => !assignedGroupIds.has(groupId),
  );
  if (elevated.length) {
    throw new ExpectedError(
      'An AI team member can use only permission groups assigned to its creator.',
      'FORBIDDEN',
    );
  }

  const customPermissions = user.customPermissions ?? [];
  if (!permissionGroupIds.length && !customPermissions.length) {
    throw new ExpectedError(
      'Your account has no permissions that can be delegated to an AI team member.',
    );
  }
  return {
    permissionGroupIds,
    customPermissions,
    mode: 'delegated',
  };
};

const MAX_AUDIENCE_IDS_PER_TYPE = 250;
const MAX_AUDIENCE_ID_LENGTH = 128;

const normalizeAudienceIds = (
  requested: string[] | undefined,
  existing: string[] | undefined,
): string[] => {
  const ids = requested ?? existing ?? [];
  if (ids.length > MAX_AUDIENCE_IDS_PER_TYPE) {
    throw new ExpectedError(
      `An audience may include at most ${MAX_AUDIENCE_IDS_PER_TYPE} targets of each type.`,
    );
  }

  const normalized = [
    ...new Set(ids.map((id) => id.trim()).filter(Boolean)),
  ];
  if (normalized.some((id) => id.length > MAX_AUDIENCE_ID_LENGTH)) {
    throw new ExpectedError('Audience identifiers are invalid.');
  }

  return normalized;
};

const normalizeAgentAudience = (
  profile: Partial<IMastraAgent>,
  existing?: IMastraAgentDocument,
) => {
  const visibility = profile.visibility ?? existing?.visibility ?? 'private';
  const audienceUserIds = normalizeAudienceIds(
    profile.audienceUserIds,
    existing?.audienceUserIds,
  );
  const audienceTeamIds = normalizeAudienceIds(
    profile.audienceTeamIds,
    existing?.audienceTeamIds,
  );
  const audienceDepartmentIds = normalizeAudienceIds(
    profile.audienceDepartmentIds,
    existing?.audienceDepartmentIds,
  );
  const hasAudience =
    audienceUserIds.length > 0 ||
    audienceTeamIds.length > 0 ||
    audienceDepartmentIds.length > 0;
  if (visibility === 'shared' && !hasAudience) {
    throw new ExpectedError(
      'Select at least one person, team, or department for a shared AI team member.',
    );
  }
  const isShared = visibility === 'shared';
  return {
    visibility,
    audienceUserIds: isShared ? audienceUserIds : [],
    audienceTeamIds: isShared ? audienceTeamIds : [],
    audienceDepartmentIds: isShared ? audienceDepartmentIds : [],
  };
};

const toAgentView = (profile: IMastraAgentDocument, account: AgentAccount) => ({
  ...profile.toObject(),
  _id: profile._id,
  visibility: profile.visibility ?? 'organization',
  audienceUserIds: profile.audienceUserIds ?? [],
  audienceTeamIds: profile.audienceTeamIds ?? [],
  audienceDepartmentIds: profile.audienceDepartmentIds ?? [],
  accountName:
    account.details?.fullName ||
    account.username ||
    account.email ||
    'AI team member',
  accountDescription: account.details?.description || '',
  permissionGroupIds: account.permissionGroupIds || [],
  isActive: account.isActive !== false,
  additionalTools: normalizeAdditionalToolKeys(profile.additionalTools),
});

const splitInput = (doc: IMastraAgentInput) => {
  const { name, description, permissionGroupIds, isActive, ...profile } = doc;
  return {
    account: { name, description, permissionGroupIds, isActive },
    profile,
  };
};

export const agentMutations = {
  mastraAgentCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraAgentInput },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.create);
    if (!user?._id) throw new ExpectedError('Login required');
    const actionScope = await requireActionScope({
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.create,
    });
    const { account, profile } = splitInput(doc);
    const name = account.name?.trim();
    const provider = profile.provider?.trim();
    const model = profile.model?.trim();
    if (!name) throw new ExpectedError('Name is required');
    if (!provider) throw new ExpectedError('Provider is required');
    if (!model) throw new ExpectedError('Model is required');

    const audience = normalizeAgentAudience(profile);
    if (audience.visibility !== 'private') {
      await checkPermission(ERXES_AGENT_ACTIONS.agent.share);
      await requireActionScope({
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.agent.share,
      });
    }
    const grant = await resolveAgentGrant(
      subdomain,
      user,
      account.permissionGroupIds ?? [],
      actionScope,
    );

    let createdAccount: AgentAccount | null = null;
    try {
      createdAccount = await createAgentAccount({
        subdomain,
        input: {
          name,
          description: account.description,
          permissionGroupIds: grant.permissionGroupIds,
          customPermissions: grant.customPermissions,
          isActive: account.isActive,
        },
      });
      const createdProfile = await models.MastraAgent.createAgent(
        createdAccount._id,
        {
          ...profile,
          provider,
          model,
          createdBy: user._id,
          visibility: audience.visibility,
          audienceUserIds: audience.audienceUserIds,
          audienceTeamIds: audience.audienceTeamIds,
          audienceDepartmentIds: audience.audienceDepartmentIds,
          additionalTools: normalizeAdditionalToolKeys(
            profile.additionalTools ?? [],
            [],
          ),
          permissionMode: grant.mode,
        },
      );
      return toAgentView(createdProfile, createdAccount);
    } catch (error) {
      if (createdAccount?._id) {
        await deactivateAgentAccount({
          userId: createdAccount._id,
          subdomain,
        }).catch(() => undefined);
        await models.MastraAgent.deleteOne({
          _id: createdAccount._id,
        });
      }
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: IMastraAgentInput },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.update);
    if (!user?._id) throw new ExpectedError('Login required');
    const { account, profile } = splitInput(doc);
    const { agent: existingProfile, scope: actionScope } =
      await requireScopedAgent({
        models,
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.agent.update,
        agentId: _id,
      });
    const existingAccount = await updateAgentAccount({
      userId: _id,
      subdomain,
      input: {},
    });

    let grant: AgentGrant | undefined;
    if (account.permissionGroupIds !== undefined) {
      grant = await resolveAgentGrant(
        subdomain,
        user,
        account.permissionGroupIds,
        actionScope,
      );
    }
    if (account.name !== undefined && !account.name.trim()) {
      throw new ExpectedError('Name is required');
    }

    const nextProfile: Partial<IMastraAgent> = { ...profile };
    if (profile.additionalTools !== undefined) {
      nextProfile.additionalTools = normalizeAdditionalToolKeys(
        profile.additionalTools,
        [],
      );
    }
    const sharingChanged =
      profile.visibility !== undefined ||
      profile.audienceUserIds !== undefined ||
      profile.audienceTeamIds !== undefined ||
      profile.audienceDepartmentIds !== undefined;
    if (sharingChanged) {
      await checkPermission(ERXES_AGENT_ACTIONS.agent.share);
      await requireScopedAgent({
        models,
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.agent.share,
        agentId: _id,
      });
      Object.assign(
        nextProfile,
        normalizeAgentAudience(profile, existingProfile),
      );
    }
    if (grant) nextProfile.permissionMode = grant.mode;

    const accountChanged =
      account.name !== undefined ||
      account.description !== undefined ||
      grant !== undefined ||
      account.isActive !== undefined;
    const profileChanged = Object.keys(nextProfile).length > 0;

    try {
      const updatedAccount = accountChanged
        ? await updateAgentAccount({
            userId: _id,
            subdomain,
            input: {
              ...(account.name !== undefined ? { name: account.name } : {}),
              ...(account.description !== undefined
                ? { description: account.description }
                : {}),
              ...(grant
                ? {
                    permissionGroupIds: grant.permissionGroupIds,
                    customPermissions: grant.customPermissions,
                  }
                : {}),
              ...(account.isActive !== undefined
                ? { isActive: account.isActive }
                : {}),
            },
          })
        : existingAccount;
      const updatedProfile = profileChanged
        ? await models.MastraAgent.updateAgent(_id, nextProfile)
        : existingProfile;
      return toAgentView(updatedProfile, updatedAccount);
    } catch (error) {
      if (accountChanged) {
        await updateAgentAccount({
          userId: _id,
          subdomain,
          input: {
            name:
              existingAccount.details?.fullName ||
              existingAccount.username ||
              existingAccount.email ||
              'AI team member',
            description: existingAccount.details?.description || '',
            permissionGroupIds: existingAccount.permissionGroupIds || [],
            customPermissions: existingAccount.customPermissions || [],
            isActive: existingAccount.isActive !== false,
          },
        }).catch(() => undefined);
      }
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.remove);
    if (!user?._id) throw new ExpectedError('Login required');
    try {
      await requireScopedAgent({
        models,
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.agent.remove,
        agentId: _id,
      });
      await deactivateAgentAccount({ userId: _id, subdomain });
      return models.MastraAgent.removeAgent(_id);
    } catch (error) {
      throw toUserFacingAgentError(error);
    }
  },
};
