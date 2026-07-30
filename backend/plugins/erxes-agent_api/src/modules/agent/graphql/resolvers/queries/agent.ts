import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { prepareChatTurn, persistTurn, runAgentTurn } from '@/agent/turn';
import { isAgentAdmin, getUserUnitIds, getAgentQuotaStatus } from '@/agent/utils';
import { IMastraAgentDocument } from '@/agent/@types/agent';

export const agentQueries = {
  mastraAgents: async (
    _parent: undefined,
    _args: undefined,
    { models, user, checkPermission }: IContext,
  ) => {
    const [, unitIds] = await Promise.all([
      checkPermission('agentsView'),
      user?._id ? getUserUnitIds(models, user._id) : Promise.resolve<string[]>([]),
    ]);
    const admin = isAgentAdmin(user);
    return models.MastraAgent.getAgents(
      user?._id,
      admin,
      user?.branchIds ?? [],
      user?.departmentIds ?? [],
      unitIds,
    );
  },

  mastraAgent: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, user, checkPermission }: IContext,
  ) => {
    const [, unitIds] = await Promise.all([
      checkPermission('agentsView'),
      user?._id ? getUserUnitIds(models, user._id) : Promise.resolve<string[]>([]),
    ]);
    const admin = isAgentAdmin(user);
    return models.MastraAgent.getAgent(
      _id,
      user?._id,
      admin,
      user?.branchIds ?? [],
      user?.departmentIds ?? [],
      unitIds,
    );
  },

  mastraAgentsMain: async (
    _parent: undefined,
    params: { page?: number; perPage?: number; searchValue?: string },
    { models, user, checkPermission }: IContext,
  ) => {
    const [, unitIds] = await Promise.all([
      checkPermission('agentsView'),
      user?._id ? getUserUnitIds(models, user._id) : Promise.resolve<string[]>([]),
    ]);
    const admin = isAgentAdmin(user);
    return models.MastraAgent.getAgentsList({
      ...params,
      userId: user?._id,
      isAdmin: admin,
      teamIds: user?.branchIds ?? [],
      deptIds: user?.departmentIds ?? [],
      unitIds,
    });
  },

  mastraMyAgentQuotaStatus: async (
    _parent: undefined,
    _args: undefined,
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsCreate');
    if (!user?._id) throw new ExpectedError('Login required');
    if (isAgentAdmin(user)) return { count: 0, quota: 0, atQuota: false };
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
    await checkPermission('agentsChat');
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

export const agentCustomResolvers = {
  MastraAgent: {
    isOwnAgent: (agent: IMastraAgentDocument, _args: unknown, { user }: IContext) =>
      Boolean(user?._id && agent.createdBy === user._id),
  },
};
