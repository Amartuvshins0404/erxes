import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { prepareChatTurn, persistTurn, runAgentTurn } from '@/agent/turn';
import { IMastraAgentDocument } from '@/agent/@types/agent';
import { agentAccessFilter, requireScopedAgent } from '@/agent/authorization';
import { requireActionScope } from '@/_shared/authorization';
import { requireUserId } from '@/_shared/auth';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';
import {
  agentAccountAppId,
  agentAccountName,
  agentIdForAccount,
  findCoreUsers,
  isAgentAccount,
} from '~/mastra/auth/servicePrincipal';
import {
  ADDITIONAL_TOOL_KEYS,
  normalizeAdditionalToolKeys,
} from '~/mastra/tools/additionalTools';

const hydrateProfiles = async (
  profiles: IMastraAgentDocument[],
  subdomain: string,
) => {
  if (!profiles.length) return [];
  const accounts = await findCoreUsers(subdomain, {
    appId: {
      $in: profiles.map((profile) => agentAccountAppId(profile._id)),
    },
  });
  const accountsById = new Map(
    accounts
      .filter(isAgentAccount)
      .map((account) => [agentIdForAccount(account), account]),
  );

  return profiles.flatMap((profile) => {
    const account = accountsById.get(profile._id);
    if (!account) return [];
    return [
      {
        ...profile.toObject(),
        _id: profile._id,
        visibility: profile.visibility ?? 'organization',
        audienceUserIds: profile.audienceUserIds ?? [],
        additionalTools: normalizeAdditionalToolKeys(profile.additionalTools),
        accountName: agentAccountName(account),
        accountDescription: account.details?.description || '',
        permissionGroupIds: account.permissionGroupIds || [],
        isActive: account.isActive !== false,
      },
    ];
  });
};

const findMatchingAccountIds = async (
  profiles: IMastraAgentDocument[],
  subdomain: string,
  searchValue?: string,
): Promise<string[]> => {
  if (!searchValue?.trim() || !profiles.length) return [];
  const accounts = await findCoreUsers(subdomain, {
    appId: {
      $in: profiles.map((profile) => agentAccountAppId(profile._id)),
    },
  });
  const needle = searchValue.trim().toLocaleLowerCase();
  return accounts
    .filter(isAgentAccount)
    .filter((account) =>
      [
        agentAccountName(account),
        account.details?.description,
        account.username,
        account.email,
      ].some((value) => value?.toLocaleLowerCase().includes(needle)),
    )
    .flatMap((account) => agentIdForAccount(account) ?? []);
};

const hydrateProfile = async (
  profile: IMastraAgentDocument,
  subdomain: string,
) => {
  const [hydrated] = await hydrateProfiles([profile], subdomain);
  if (!hydrated) throw new ExpectedError('AI team member account not found');
  return hydrated;
};

export const agentQueries = {
  mastraAgentAdditionalTools: async (
    _parent: undefined,
    _args: undefined,
    { checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.readSummary);
    return ADDITIONAL_TOOL_KEYS;
  },
  mastraAgents: async (
    _parent: undefined,
    _args: undefined,
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.readSummary);
    requireUserId(user);
    const scope = await requireActionScope({
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.readSummary,
    });
    const profiles = await models.MastraAgent.getAgents(
      agentAccessFilter(user, scope),
    );
    return hydrateProfiles(profiles, subdomain);
  },

  mastraAgent: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.readConfig);
    requireUserId(user);
    const { agent } = await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.readConfig,
      agentId: _id,
    });
    return hydrateProfile(agent, subdomain);
  },

  mastraAgentsMain: async (
    _parent: undefined,
    params: { page?: number; perPage?: number; searchValue?: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.readSummary);
    requireUserId(user);
    const scope = await requireActionScope({
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.readSummary,
    });
    const filter = agentAccessFilter(user, scope);
    const allProfiles = params.searchValue
      ? await models.MastraAgent.getAgents(filter)
      : [];
    const matchingAccountIds = await findMatchingAccountIds(
      allProfiles,
      subdomain,
      params.searchValue,
    );
    const result = await models.MastraAgent.getAgentsList({
      ...params,
      matchingAccountIds,
      filter,
    });
    const list = await hydrateProfiles(result.list, subdomain);
    return { ...result, list };
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
    requireUserId(user);
    await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.chat,
      agentId,
    });
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
      activeTools: prepared.activeTools,
      turnInstructions: prepared.turnInstructions,
    });

    await persistTurn({
      models,
      prepared,
      reply,
      hasArtifacts: (prepared.authCtx.artifactCount ?? 0) > 0,
    });
    return reply;
  },
};
