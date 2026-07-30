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
  const models = {
    MastraAgent: {
      collection: { find, updateOne },
    },
  } as unknown as IModels;
  return { models, find, updateOne };
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
    const { models, find, updateOne } = makeModels();

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
