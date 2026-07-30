const sendTRPCMessage = jest.fn();
const clearGroupActionsCache = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));
jest.mock('erxes-api-shared/core-modules', () => ({
  clearGroupActionsCache: (...args: unknown[]) =>
    clearGroupActionsCache(...args),
}));

import {
  adoptLegacyAgentAccount,
  createAgentAccount,
  deactivateAgentAccount,
  getAgentAccount,
  updateAgentAccount,
} from '../servicePrincipal';

interface TrpcCall {
  action: string;
  method: string;
  input: {
    query?: Record<string, unknown>;
    data?: Record<string, unknown>;
    selector?: Record<string, unknown>;
    modifier?: Record<string, unknown>;
  };
}

const calls = (): TrpcCall[] =>
  sendTRPCMessage.mock.calls.map(([call]) => call as TrpcCall);

const callsFor = (action: string): TrpcCall[] =>
  calls().filter((call) => call.action === action);

const pendingUser = {
  _id: 'agent-user-1',
  role: 'user',
  isActive: true,
  email: 'agent-sales-agent-123456789abc@agents.local',
  username: 'agent-sales-agent-123456789abc',
  details: { fullName: 'Sales Agent', description: 'Handles sales' },
};

const readyUser = {
  ...pendingUser,
  isOwner: false,
  appId: 'erxes-agent:agent-user-1',
  permissionGroupIds: ['group-1', 'group-2'],
};

beforeEach(() => {
  sendTRPCMessage.mockReset();
  clearGroupActionsCache.mockReset().mockResolvedValue(undefined);
});

describe('createAgentAccount', () => {
  it('creates a passwordless core team member, marks it as AI-owned, and assigns every selected group', async () => {
    let marked = false;
    sendTRPCMessage.mockImplementation(async (call: TrpcCall) => {
      if (call.action === 'create') return pendingUser;
      if (call.action === 'updateOne') {
        marked = true;
        return { acknowledged: true };
      }
      if (call.action === 'findOne') return marked ? readyUser : pendingUser;
      return null;
    });

    const result = await createAgentAccount({
      subdomain: 'os',
      input: {
        name: ' Sales Agent ',
        description: ' Handles sales ',
        permissionGroupIds: [' group-1 ', 'group-2', 'group-1'],
        isActive: true,
      },
    });

    const createData = callsFor('create')[0].input.data;
    expect(createData).toEqual(
      expect.objectContaining({
        notUsePassword: true,
        isActive: true,
        isOwner: false,
        details: {
          fullName: 'Sales Agent',
          description: 'Handles sales',
        },
      }),
    );
    expect(createData?.username).toMatch(/^agent-sales-agent-[a-f0-9]{12}$/);
    expect(createData?.email).toBe(`${createData?.username}@agents.local`);
    expect(callsFor('updateOne')[0].input).toEqual({
      selector: { _id: 'agent-user-1' },
      modifier: {
        $set: {
          role: 'user',
          isOwner: false,
          isActive: true,
          appId: 'erxes-agent:agent-user-1',
          permissionGroupIds: ['group-1', 'group-2'],
          'details.fullName': 'Sales Agent',
          'details.description': 'Handles sales',
        },
      },
    });
    expect(clearGroupActionsCache).toHaveBeenCalledWith({
      subdomain: 'os',
      userId: 'agent-user-1',
    });
    expect(result).toEqual(readyUser);
  });

  it('links a core-generated account ID to a requested legacy profile ID', async () => {
    const linkedUser = {
      ...readyUser,
      appId: 'erxes-agent:legacy-profile-1',
    };
    let marked = false;
    sendTRPCMessage.mockImplementation(async (call: TrpcCall) => {
      if (call.action === 'create') return pendingUser;
      if (call.action === 'updateOne') {
        marked = true;
        return { acknowledged: true };
      }
      if (call.action === 'findOne') return marked ? linkedUser : null;
      return null;
    });

    const result = await createAgentAccount({
      userId: 'legacy-profile-1',
      subdomain: 'os',
      input: {
        name: 'Sales Agent',
        permissionGroupIds: ['group-1', 'group-2'],
      },
    });

    expect(callsFor('create')[0].input.data?._id).toBeUndefined();
    expect(callsFor('updateOne')[0].input.modifier).toEqual(
      expect.objectContaining({
        $set: expect.objectContaining({
          appId: 'erxes-agent:legacy-profile-1',
        }),
      }),
    );
    expect(result).toEqual(linkedUser);
  });

  it('deactivates a partially created account when finalization fails', async () => {
    let updateCount = 0;
    sendTRPCMessage.mockImplementation(async (call: TrpcCall) => {
      if (call.action === 'create') return pendingUser;
      if (call.action === 'updateOne') {
        updateCount += 1;
        if (updateCount === 1) throw new Error('core update failed');
        return { acknowledged: true };
      }
      return null;
    });

    await expect(
      createAgentAccount({
        subdomain: 'os',
        input: {
          name: 'Sales Agent',
          permissionGroupIds: ['group-1'],
        },
      }),
    ).rejects.toThrow('core update failed');

    expect(callsFor('updateOne')[1].input).toEqual({
      selector: { _id: 'agent-user-1' },
      modifier: { $set: { isActive: false } },
    });
  });
});

describe('account validation and updates', () => {
  it('rejects ordinary human users as AI execution principals', async () => {
    sendTRPCMessage.mockResolvedValue({
      _id: 'human-user-1',
      role: 'user',
      isActive: true,
      email: 'person@example.com',
    });

    await expect(
      getAgentAccount({ userId: 'human-user-1', subdomain: 'os' }),
    ).rejects.toThrow(/not found/i);
  });

  it('updates profile fields, activity, and combined permission groups on core', async () => {
    const changed = {
      ...readyUser,
      details: { fullName: 'Revenue Agent', description: 'Handles revenue' },
      permissionGroupIds: ['group-2', 'group-3'],
      isActive: false,
    };
    let updated = false;
    sendTRPCMessage.mockImplementation(async (call: TrpcCall) => {
      if (call.action === 'findOne') return updated ? changed : readyUser;
      if (call.action === 'updateOne') {
        updated = true;
        return { acknowledged: true };
      }
      return null;
    });

    const result = await updateAgentAccount({
      userId: 'agent-user-1',
      subdomain: 'os',
      input: {
        name: ' Revenue Agent ',
        description: ' Handles revenue ',
        permissionGroupIds: ['group-2', ' group-3 ', 'group-2'],
        isActive: false,
      },
    });

    expect(callsFor('updateOne')[0].input).toEqual({
      selector: { _id: 'agent-user-1' },
      modifier: {
        $set: {
          'details.fullName': 'Revenue Agent',
          'details.description': 'Handles revenue',
          permissionGroupIds: ['group-2', 'group-3'],
          isActive: false,
        },
      },
    });
    expect(clearGroupActionsCache).toHaveBeenCalledWith({
      subdomain: 'os',
      userId: 'agent-user-1',
    });
    expect(result).toEqual(changed);
  });

  it('deactivates the canonical team member and clears permission cache', async () => {
    sendTRPCMessage.mockImplementation(async (call: TrpcCall) => {
      if (call.action === 'findOne') return readyUser;
      return { acknowledged: true };
    });

    await deactivateAgentAccount({ userId: 'agent-user-1', subdomain: 'os' });

    expect(callsFor('updateOne')[0].input).toEqual({
      selector: { _id: 'agent-user-1' },
      modifier: { $set: { isActive: false } },
    });
    expect(clearGroupActionsCache).toHaveBeenCalledWith({
      subdomain: 'os',
      userId: 'agent-user-1',
    });
  });
});

describe('adoptLegacyAgentAccount', () => {
  it('links a marked legacy account to its existing plugin profile', async () => {
    const legacy = {
      _id: 'legacy-user-1',
      role: 'system',
      isActive: true,
      email: 'sales-agent@agents.local',
    };
    const adopted = {
      ...readyUser,
      _id: 'legacy-user-1',
      appId: 'erxes-agent:legacy-profile-1',
    };
    let updated = false;
    sendTRPCMessage.mockImplementation(async (call: TrpcCall) => {
      if (call.action === 'findOne') return updated ? adopted : legacy;
      if (call.action === 'updateOne') {
        updated = true;
        return { acknowledged: true };
      }
      return null;
    });

    const result = await adoptLegacyAgentAccount({
      agentId: 'legacy-profile-1',
      accountId: 'legacy-user-1',
      subdomain: 'os',
      name: 'Sales Agent',
      description: 'Handles sales',
      permissionGroupIds: ['group-1'],
      isActive: true,
    });

    expect(callsFor('updateOne')[0].input).toEqual({
      selector: { _id: 'legacy-user-1' },
      modifier: {
        $set: expect.objectContaining({
          role: 'user',
          isOwner: false,
          appId: 'erxes-agent:legacy-profile-1',
          permissionGroupIds: ['group-1'],
        }),
      },
    });
    expect(result).toEqual(adopted);
  });

  it('never claims an ordinary human account during migration', async () => {
    sendTRPCMessage.mockResolvedValue({
      _id: 'human-user-1',
      role: 'user',
      email: 'person@example.com',
    });

    await expect(
      adoptLegacyAgentAccount({
        agentId: 'human-profile-1',
        accountId: 'human-user-1',
        subdomain: 'os',
        name: 'Sales Agent',
        permissionGroupIds: ['group-1'],
        isActive: true,
      }),
    ).rejects.toThrow(/Refusing to claim/);
    expect(callsFor('updateOne')).toHaveLength(0);
  });
});
