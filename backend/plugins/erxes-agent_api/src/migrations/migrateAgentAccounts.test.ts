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

interface StoredProfile extends Record<string, unknown> {
  _id: string;
}

const legacyProfile: StoredProfile = {
  _id: 'agent-profile-1',
  agentId: 'sales-agent',
  name: 'Sales Agent',
  description: 'Handles sales work',
  isEnabled: true,
  serviceUserId: 'legacy-service-user-1',
  grantGroupId: 'legacy-group',
  provider: 'openai',
  model: 'gpt-4.1',
  instructions: 'Handle sales work',
};

const LEGACY_KEYS = new Set([
  'name',
  'agentId',
  'description',
  'isEnabled',
  'serviceUserId',
  'agentUserId',
  'grantGroupId',
  'createdBy',
  'visibility',
  'teamId',
  'departmentId',
  'unitId',
]);

const makeCollection = (
  collectionName: string,
  initial: StoredProfile[] = [],
) => {
  const store = new Map(
    initial.map((profile) => [profile._id, { ...profile }]),
  );
  const find = jest.fn((filter: Record<string, unknown>) => ({
    async *[Symbol.asyncIterator]() {
      const rows = [...store.values()].filter(
        (profile) =>
          Object.keys(filter).length === 0 ||
          Object.keys(profile).some((key) => LEGACY_KEYS.has(key)),
      );
      for (const profile of rows) yield { ...profile };
    },
  }));
  const updateOne = jest.fn(
    async (
      selector: { _id: string },
      update: {
        $unset?: Record<string, string>;
        $setOnInsert?: Record<string, unknown>;
      },
      options?: { upsert?: boolean },
    ) => {
      const existing = store.get(selector._id);
      if (existing && update.$unset) {
        for (const key of Object.keys(update.$unset)) delete existing[key];
      } else if (!existing && options?.upsert && update.$setOnInsert) {
        store.set(selector._id, {
          _id: selector._id,
          ...update.$setOnInsert,
        });
      }
      return { modifiedCount: existing ? 1 : 0 };
    },
  );
  const deleteOne = jest.fn(async ({ _id }: { _id: string }) => {
    store.delete(_id);
    return { deletedCount: 1 };
  });
  return { collectionName, store, find, updateOne, deleteOne };
};

const makeModels = (options?: {
  legacy?: StoredProfile[];
  current?: StoredProfile[];
}) => {
  const legacy = makeCollection('mastra_agents', options?.legacy);
  const current = makeCollection('mastra_agent_profiles', options?.current);
  const collection = jest.fn(() => legacy);
  const models = {
    MastraAgent: {
      collection: current,
      db: { collection },
    },
  } as unknown as IModels;
  return { models, legacy, current, collection };
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
  it('moves a legacy collection profile and adopts its service account once', async () => {
    const { models, legacy, current } = makeModels({
      legacy: [legacyProfile],
    });

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
    expect(legacy.store.size).toBe(0);
    expect(current.store.get('agent-profile-1')).toEqual({
      _id: 'agent-profile-1',
      provider: 'openai',
      model: 'gpt-4.1',
      instructions: 'Handle sales work',
    });
  });

  it('keeps the source profile intact when account creation fails', async () => {
    const { models, legacy, current } = makeModels({
      legacy: [legacyProfile],
    });
    findCoreUsers.mockResolvedValue([]);
    createAgentAccount.mockRejectedValue(new Error('core unavailable'));

    await migrateTenantAgentAccounts(models, 'os');

    expect(legacy.store.get('agent-profile-1')).toEqual(legacyProfile);
    expect(current.store.size).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('migration failed for agent-profile-1'),
    );
  });

  it('preserves an already-written target profile while completing a retry', async () => {
    const currentProfile = {
      _id: 'agent-profile-1',
      provider: 'openai',
      model: 'gpt-4.1',
      instructions: 'New instructions',
    };
    const { models, legacy, current } = makeModels({
      legacy: [legacyProfile],
      current: [currentProfile],
    });
    getAgentAccount.mockResolvedValue({ _id: 'account-1' });

    await migrateTenantAgentAccounts(models, 'os');

    expect(updateAgentAccount).toHaveBeenCalledTimes(1);
    expect(current.store.get('agent-profile-1')).toEqual(currentProfile);
    expect(legacy.store.size).toBe(0);
  });
});
