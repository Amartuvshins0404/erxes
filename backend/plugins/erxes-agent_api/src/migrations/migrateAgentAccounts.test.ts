const getAgentAccount = jest.fn();
const findCoreUsers = jest.fn();
const createAgentAccount = jest.fn();
const updateAgentAccount = jest.fn();
const adoptLegacyAgentAccount = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  getEnv: jest.fn(() => 'os'),
  getSaasOrganizations: jest.fn(() => []),
}));
jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn(),
}));
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  getAgentAccount: (...args: unknown[]) => getAgentAccount(...args),
  findCoreUsers: (...args: unknown[]) => findCoreUsers(...args),
  createAgentAccount: (...args: unknown[]) => createAgentAccount(...args),
  updateAgentAccount: (...args: unknown[]) => updateAgentAccount(...args),
  adoptLegacyAgentAccount: (...args: unknown[]) =>
    adoptLegacyAgentAccount(...args),
  isAdoptableAgentAccount: (account?: {
    role?: string;
    email?: string;
    appId?: string;
  }) =>
    Boolean(
      account?.appId?.startsWith('erxes-agent:') ||
        (account?.role === 'system' &&
          account.email?.endsWith('@agents.local')),
    ),
}));

import type { IModels } from '~/connectionResolvers';
import { MongoServerError } from 'mongodb';
import { migrateTenantAgentAccounts } from './migrateAgentAccounts';

const legacyProfile: Record<string, unknown> = {
  _id: 'agent-profile-1',
  agentId: 'sales-agent',
  name: 'Sales Agent',
  description: 'Handles sales work',
  isEnabled: true,
  serviceUserId: 'legacy-service-user-1',
  grantGroupId: 'legacy-group',
};

const makeModels = () => {
  const profile = { ...legacyProfile };
  const updateOne = jest.fn(
    async (_selector: unknown, update: { $unset?: Record<string, string> }) => {
      for (const key of Object.keys(update.$unset ?? {})) delete profile[key];
      return { modifiedCount: 1 };
    },
  );
  const find = jest.fn(() => ({
    async *[Symbol.asyncIterator]() {
      if ('agentId' in profile) yield { ...profile };
    },
  }));
  let hasLegacyIndex = true;
  const indexExists = jest.fn(async () => hasLegacyIndex);
  const dropIndex = jest.fn(async () => {
    hasLegacyIndex = false;
    return { ok: 1 };
  });
  const models = {
    MastraAgent: {
      init: jest.fn(async () => ({})),
      collection: { find, updateOne, indexExists, dropIndex },
    },
  } as unknown as IModels;
  return { models, find, updateOne, indexExists, dropIndex };
};

beforeEach(() => {
  getAgentAccount.mockReset().mockRejectedValue(new Error('not canonical'));
  findCoreUsers
    .mockReset()
    .mockImplementation((_subdomain: string, query: { _id?: string }) =>
      query._id === 'legacy-service-user-1'
        ? Promise.resolve([
            {
              _id: 'legacy-service-user-1',
              role: 'system',
              email: 'sales-agent@agents.local',
              permissionGroupIds: ['legacy-group'],
              details: { fullName: 'Sales Agent' },
            },
          ])
        : Promise.resolve([]),
    );
  createAgentAccount.mockReset().mockResolvedValue({
    _id: 'agent-profile-1',
  });
  updateAgentAccount.mockReset();
  adoptLegacyAgentAccount.mockReset();
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('migrateTenantAgentAccounts', () => {
  it('adopts the legacy service account and links it to the profile once', async () => {
    const { models, find, updateOne, indexExists, dropIndex } = makeModels();

    await migrateTenantAgentAccounts(models, 'os');
    await migrateTenantAgentAccounts(models, 'os');

    expect(adoptLegacyAgentAccount).toHaveBeenCalledTimes(1);
    expect(adoptLegacyAgentAccount).toHaveBeenCalledWith({
      agentId: 'agent-profile-1',
      accountId: 'legacy-service-user-1',
      subdomain: 'os',
      name: 'Sales Agent',
      description: 'Handles sales work',
      permissionGroupIds: ['legacy-group'],
      isActive: true,
    });
    expect(createAgentAccount).not.toHaveBeenCalled();
    expect(updateOne).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledTimes(2);
    expect(indexExists).toHaveBeenCalledTimes(2);
    expect(dropIndex).toHaveBeenCalledTimes(1);
    expect(dropIndex.mock.invocationCallOrder[0]).toBeLessThan(
      updateOne.mock.invocationCallOrder[0],
    );
  });

  it('retries the legacy index drop while a background index build drains', async () => {
    const { models, dropIndex } = makeModels();
    dropIndex
      .mockRejectedValueOnce(
        new MongoServerError({
          message:
            'cannot perform operation: a background operation is currently running',
          code: 12586,
        }),
      )
      .mockResolvedValue({ ok: 1 });

    await migrateTenantAgentAccounts(models, 'os');

    expect(dropIndex).toHaveBeenCalledTimes(2);
    expect(adoptLegacyAgentAccount).toHaveBeenCalledTimes(1);
  });

  it('still drops the legacy index when the autoIndex build wait fails', async () => {
    const { models, dropIndex } = makeModels();
    (models.MastraAgent.init as unknown as jest.Mock).mockRejectedValue(
      new Error('index build failed'),
    );

    await migrateTenantAgentAccounts(models, 'os');

    expect(dropIndex).toHaveBeenCalledTimes(1);
    expect(adoptLegacyAgentAccount).toHaveBeenCalledTimes(1);
  });

  it('keeps legacy fields intact when account creation fails so startup can retry', async () => {
    const { models, updateOne } = makeModels();
    findCoreUsers.mockResolvedValue([]);
    createAgentAccount.mockRejectedValue(new Error('core unavailable'));

    await migrateTenantAgentAccounts(models, 'os');

    expect(updateOne).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('migration failed for agent-profile-1'),
    );
  });
});
