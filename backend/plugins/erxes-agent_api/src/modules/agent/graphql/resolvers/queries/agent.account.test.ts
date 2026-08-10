class ExpectedError extends Error {}

const sendTRPCMessage = jest.fn();
jest.mock('erxes-api-shared/utils', () => ({
  ExpectedError,
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

const requireActionScope = jest.fn();
jest.mock('@/_shared/authorization', () => ({
  requireActionScope: (...args: unknown[]) => requireActionScope(...args),
}));

jest.mock('@/agent/turn', () => ({
  prepareChatTurn: jest.fn(),
  persistTurn: jest.fn(),
  runAgentTurn: jest.fn(),
}));

const findCoreUsers = jest.fn();
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  agentAccountAppId: (agentId: string) => `erxes-agent:${agentId}`,
  agentIdForAccount: (account: { appId?: string }) =>
    account.appId?.replace(/^erxes-agent:/, '') || null,
  agentAccountName: (account: {
    details?: { fullName?: string };
    username?: string;
    email?: string;
  }) =>
    account.details?.fullName ||
    account.username ||
    account.email ||
    'AI team member',
  findCoreUsers: (...args: unknown[]) => findCoreUsers(...args),
  isAgentAccount: (account: {
    role?: string;
    isOwner?: boolean;
    appId?: string;
  }) =>
    account.role === 'user' &&
    account.isOwner !== true &&
    Boolean(account.appId?.startsWith('erxes-agent:')),
}));

import type { IContext } from '~/connectionResolvers';
import { agentQueries } from './agent';

const profile = (id: string, provider = 'openai') => {
  const value = {
    _id: id,
    provider,
    model: 'gpt-5',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  return { ...value, toObject: jest.fn(() => value) };
};

const agentAccount = (accountId: string, name: string, agentId: string) => ({
  _id: accountId,
  role: 'user',
  isOwner: false,
  isActive: true,
  appId: `erxes-agent:${agentId}`,
  details: { fullName: name, description: `${name} description` },
  permissionGroupIds: ['group-1'],
});

const makeCtx = () => {
  const profiles = [profile('account-1'), profile('account-2', 'anthropic')];
  const getAgents = jest.fn().mockResolvedValue(profiles);
  const findOne = jest.fn().mockResolvedValue(profiles[0]);
  const getAgentsList = jest.fn().mockResolvedValue({
    list: [profiles[1]],
    totalCount: 1,
  });
  const ctx = {
    models: {
      MastraAgent: { getAgents, getAgentsList, findOne },
    },
    subdomain: 'os',
    user: { _id: 'human-1' },
    checkPermission: jest.fn().mockResolvedValue(undefined),
  } as unknown as IContext;
  return { ctx, profiles, getAgents, getAgentsList, findOne };
};

beforeEach(() => {
  requireActionScope.mockReset().mockResolvedValue('group');
  sendTRPCMessage.mockReset().mockResolvedValue([]);
  findCoreUsers.mockReset();
});

describe('account-hydrated agent queries', () => {
  it('returns only profiles backed by marked core AI team-member accounts', async () => {
    findCoreUsers.mockResolvedValue([
      agentAccount('core-user-1', 'Sales Agent', 'account-1'),
      {
        _id: 'account-2',
        role: 'user',
        isOwner: false,
        isActive: true,
        details: { fullName: 'Ordinary Person' },
      },
    ]);
    const { ctx } = makeCtx();

    const result = await agentQueries.mastraAgents(undefined, undefined, ctx);

    expect(ctx.models.MastraAgent.getAgents).toHaveBeenCalledWith({
      $or: [
        { createdBy: 'human-1' },
        { visibility: 'organization' },
        { visibility: { $exists: false } },
        { visibility: 'shared', audienceUserIds: 'human-1' },
      ],
    });

    expect(findCoreUsers).toHaveBeenCalledWith('os', {
      appId: {
        $in: ['erxes-agent:account-1', 'erxes-agent:account-2'],
      },
    });
    expect(result).toEqual([
      expect.objectContaining({
        _id: 'account-1',
        accountName: 'Sales Agent',
        accountDescription: 'Sales Agent description',
        permissionGroupIds: ['group-1'],
        isActive: true,
        provider: 'openai',
      }),
    ]);
  });

  it('searches core account identity and paginates matching profile ids', async () => {
    findCoreUsers
      .mockResolvedValueOnce([
        agentAccount('core-user-1', 'Sales Agent', 'account-1'),
        agentAccount('core-user-2', 'Support Agent', 'account-2'),
      ])
      .mockResolvedValueOnce([
        agentAccount('core-user-2', 'Support Agent', 'account-2'),
      ]);
    const { ctx, getAgents, getAgentsList } = makeCtx();

    const result = await agentQueries.mastraAgentsMain(
      undefined,
      { page: 1, perPage: 30, searchValue: 'support' },
      ctx,
    );

    expect(getAgents).toHaveBeenCalledTimes(1);
    expect(getAgentsList).toHaveBeenCalledWith({
      page: 1,
      perPage: 30,
      searchValue: 'support',
      matchingAccountIds: ['account-2'],
      filter: {
        $or: [
          { createdBy: 'human-1' },
          { visibility: 'organization' },
          { visibility: { $exists: false } },
          { visibility: 'shared', audienceUserIds: 'human-1' },
        ],
      },
    });
    expect(result).toEqual({
      totalCount: 1,
      list: [
        expect.objectContaining({
          _id: 'account-2',
          accountName: 'Support Agent',
        }),
      ],
    });
  });

  it('fails detail lookup when the canonical team-member account is missing', async () => {
    findCoreUsers.mockResolvedValue([]);
    const { ctx } = makeCtx();

    await expect(
      agentQueries.mastraAgent(undefined, { _id: 'account-1' }, ctx),
    ).rejects.toThrow(/account not found/i);
  });
});
