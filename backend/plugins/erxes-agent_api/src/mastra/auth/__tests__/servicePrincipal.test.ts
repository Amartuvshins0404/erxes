// Step 21 — agent service-user lifecycle. ensureServiceUser provisions /
// reconciles a passwordless role:'system' core user per agent via the core
// `users.*` trpc router; syncServiceUserGroup assigns a permission group and
// invalidates the user's action cache; deactivateServiceUser flips isActive
// off on agent delete. sendTRPCMessage is mocked — no live DB / network.
const sendTRPCMessage = jest.fn();
const clearGroupActionsCache = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));
jest.mock('erxes-api-shared/core-modules', () => ({
  clearGroupActionsCache: (...args: unknown[]) => clearGroupActionsCache(...args),
}));

import {
  ensureServiceUser,
  syncServiceUserGroup,
  deactivateServiceUser,
} from '../servicePrincipal';

type TrpcCall = { action: string; method: string; input: any };

/** Capture every trpc call so assertions can inspect action + input. */
const calls = (): TrpcCall[] =>
  sendTRPCMessage.mock.calls.map(([arg]) => arg as TrpcCall);

const callsFor = (action: string): TrpcCall[] =>
  calls().filter((c) => c.action === action);

const makeModels = () =>
  ({
    MastraAgent: { updateOne: jest.fn().mockResolvedValue({ acknowledged: true }) },
  }) as any;

const agentConfig = (overrides: Record<string, unknown> = {}) => ({
  _id: 'agent-doc-1',
  agentId: 'Sales_Bot',
  name: 'Sales Bot',
  ...overrides,
});

beforeEach(() => {
  sendTRPCMessage.mockReset();
  clearGroupActionsCache.mockReset();
});

describe('ensureServiceUser', () => {
  it('returns the stored user + its current groups when intact (idempotent, no create)', async () => {
    sendTRPCMessage.mockImplementation(async ({ action }: TrpcCall) => {
      if (action === 'findOne') {
        // The mint path (step 22) reads permissionGroupIds off the reconciled
        // user to decide whether a group sync is needed.
        return {
          _id: 'svc-1',
          role: 'system',
          isActive: true,
          permissionGroupIds: ['grp-9'],
        };
      }
      return null;
    });
    const models = makeModels();

    const res = await ensureServiceUser({
      agentConfig: agentConfig({ serviceUserId: 'svc-1' }),
      subdomain: 'os',
      models,
    });

    expect(res).toEqual({ serviceUserId: 'svc-1', permissionGroupIds: ['grp-9'] });
    expect(callsFor('create')).toHaveLength(0);
    expect(callsFor('updateOne')).toHaveLength(0); // already active + system
    expect(models.MastraAgent.updateOne).not.toHaveBeenCalled();
  });

  it('re-creates when the stored user was deleted out-of-band', async () => {
    sendTRPCMessage.mockImplementation(async ({ action }: TrpcCall) => {
      if (action === 'findOne') return null; // deleted
      if (action === 'create') return { _id: 'svc-new', role: 'user', isActive: true };
      return null;
    });
    const models = makeModels();
    const cfg = agentConfig({ serviceUserId: 'svc-gone' });

    const res = await ensureServiceUser({ agentConfig: cfg, subdomain: 'os', models });

    // A freshly created user has no groups yet.
    expect(res).toEqual({ serviceUserId: 'svc-new', permissionGroupIds: [] });
    const create = callsFor('create')[0];
    expect(create.input.data).toMatchObject({
      notUsePassword: true,
      isActive: true,
      isOwner: false,
      email: 'agent-sales_bot@agents.local',
      username: 'agent-sales_bot',
      details: { fullName: 'Sales Bot (agent)' },
    });
    // role:'system' set via follow-up updateOne (createUser ignores role)
    expect(callsFor('updateOne')).toEqual([
      expect.objectContaining({
        input: { selector: { _id: 'svc-new' }, modifier: { $set: { role: 'system' } } },
      }),
    ]);
    // new id persisted onto the agent config
    expect(models.MastraAgent.updateOne).toHaveBeenCalledWith(
      { _id: 'agent-doc-1' },
      { $set: { serviceUserId: 'svc-new' } },
    );
    expect(cfg.serviceUserId).toBe('svc-new');
  });

  it('reactivates a stored user that had been deactivated', async () => {
    sendTRPCMessage.mockImplementation(async ({ action }: TrpcCall) => {
      if (action === 'findOne') {
        return { _id: 'svc-1', role: 'system', isActive: false };
      }
      return null;
    });
    const models = makeModels();

    const res = await ensureServiceUser({
      agentConfig: agentConfig({ serviceUserId: 'svc-1' }),
      subdomain: 'os',
      models,
    });

    expect(res).toEqual({ serviceUserId: 'svc-1', permissionGroupIds: [] });
    expect(callsFor('create')).toHaveLength(0);
    expect(callsFor('updateOne')).toEqual([
      expect.objectContaining({
        input: { selector: { _id: 'svc-1' }, modifier: { $set: { isActive: true } } },
      }),
    ]);
    // id unchanged → not re-persisted
    expect(models.MastraAgent.updateOne).not.toHaveBeenCalled();
  });

  it('adopts the existing user on a duplicate-email race', async () => {
    sendTRPCMessage.mockImplementation(async ({ action, input }: TrpcCall) => {
      if (action === 'create') return null; // duplicate → swallowed as null
      if (action === 'findOne' && input.query.email) {
        return { _id: 'svc-raced', role: 'user', isActive: true };
      }
      return null;
    });
    const models = makeModels();
    const cfg = agentConfig(); // no serviceUserId

    const res = await ensureServiceUser({ agentConfig: cfg, subdomain: 'os', models });

    expect(res).toEqual({ serviceUserId: 'svc-raced', permissionGroupIds: [] });
    // adopted by email lookup
    expect(callsFor('findOne')[0].input).toEqual({
      query: { email: 'agent-sales_bot@agents.local' },
    });
    // role repaired to system on the adopted user
    expect(callsFor('updateOne')).toContainEqual(
      expect.objectContaining({
        input: { selector: { _id: 'svc-raced' }, modifier: { $set: { role: 'system' } } },
      }),
    );
    expect(cfg.serviceUserId).toBe('svc-raced');
  });

  it('throws (fail-closed) when create fails and no user can be adopted', async () => {
    sendTRPCMessage.mockResolvedValue(null); // create null + no user by email
    const models = makeModels();

    await expect(
      ensureServiceUser({ agentConfig: agentConfig(), subdomain: 'os', models }),
    ).rejects.toThrow(/Failed to ensure service user/);
    expect(models.MastraAgent.updateOne).not.toHaveBeenCalled();
  });
});

describe('syncServiceUserGroup', () => {
  it('assigns the group and invalidates the action cache', async () => {
    sendTRPCMessage.mockResolvedValue({ acknowledged: true });
    const models = makeModels();
    const cfg = agentConfig({ serviceUserId: 'svc-1' });

    await syncServiceUserGroup({
      serviceUserId: 'svc-1',
      groupId: 'grp-9',
      subdomain: 'os',
      models,
      agentConfig: cfg,
    });

    expect(callsFor('updateOne')[0].input).toEqual({
      selector: { _id: 'svc-1' },
      modifier: { $set: { permissionGroupIds: ['grp-9'] } },
    });
    expect(clearGroupActionsCache).toHaveBeenCalledWith({ userId: 'svc-1' });
    expect(models.MastraAgent.updateOne).toHaveBeenCalledWith(
      { _id: 'agent-doc-1' },
      { $set: { grantGroupId: 'grp-9' } },
    );
    expect(cfg.grantGroupId).toBe('grp-9');
  });

  it('clears the group (empty array) when groupId is null', async () => {
    sendTRPCMessage.mockResolvedValue({ acknowledged: true });

    await syncServiceUserGroup({
      serviceUserId: 'svc-1',
      groupId: null,
      subdomain: 'os',
    });

    expect(callsFor('updateOne')[0].input.modifier).toEqual({
      $set: { permissionGroupIds: [] },
    });
    expect(clearGroupActionsCache).toHaveBeenCalledWith({ userId: 'svc-1' });
  });
});

describe('deactivateServiceUser', () => {
  it('sets isActive:false via updateOne (not the toggling setActiveStatus)', async () => {
    sendTRPCMessage.mockResolvedValue({ acknowledged: true });

    await deactivateServiceUser({ serviceUserId: 'svc-1', subdomain: 'os' });

    expect(callsFor('setActiveStatus')).toHaveLength(0);
    expect(callsFor('updateOne')).toEqual([
      expect.objectContaining({
        action: 'updateOne',
        input: { selector: { _id: 'svc-1' }, modifier: { $set: { isActive: false } } },
      }),
    ]);
  });
});
