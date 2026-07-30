const getAgentAccount = jest.fn();
const findCoreUsers = jest.fn();
const createAgentAccount = jest.fn();
const updateAgentAccount = jest.fn();
const adoptLegacyAgentAccount = jest.fn();
const retireLegacyAgentAccount = jest.fn();

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
  retireLegacyAgentAccount: (...args: unknown[]) =>
    retireLegacyAgentAccount(...args),
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
  retireLegacyAgentAccount.mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('migrateTenantAgentAccounts', () => {
  it('creates the team member under the profile ID and retires the old service user once', async () => {
    const { models, find, updateOne } = makeModels();

    await migrateTenantAgentAccounts(models, 'os');
    await migrateTenantAgentAccounts(models, 'os');

    expect(createAgentAccount).toHaveBeenCalledTimes(1);
    expect(createAgentAccount).toHaveBeenCalledWith({
      userId: 'agent-profile-1',
      subdomain: 'os',
      input: {
        name: 'Sales Agent',
        description: 'Handles sales work',
        permissionGroupIds: ['legacy-group'],
        isActive: true,
      },
    });
    expect(retireLegacyAgentAccount).toHaveBeenCalledWith({
      userId: 'legacy-service-user-1',
      subdomain: 'os',
    });
    expect(updateOne).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledTimes(2);
  });

  it('keeps legacy fields intact when account creation fails so startup can retry', async () => {
    const { models, updateOne } = makeModels();
    createAgentAccount.mockRejectedValue(new Error('core unavailable'));

    await migrateTenantAgentAccounts(models, 'os');

    expect(updateOne).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('migration failed for agent-profile-1'),
    );
  });
});
