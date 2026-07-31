class ExpectedError extends Error {}

jest.mock('erxes-api-shared/utils', () => ({ ExpectedError }));

const canGroup = jest.fn();
jest.mock('erxes-api-shared/core-modules', () => ({
  canGroup: (...args: unknown[]) => canGroup(...args),
}));

const createAgentAccount = jest.fn();
const updateAgentAccount = jest.fn();
const deactivateAgentAccount = jest.fn();
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  createAgentAccount: (...args: unknown[]) => createAgentAccount(...args),
  updateAgentAccount: (...args: unknown[]) => updateAgentAccount(...args),
  deactivateAgentAccount: (...args: unknown[]) =>
    deactivateAgentAccount(...args),
}));

const resolveAgentPermissions = jest.fn();
jest.mock('~/mastra/tools/permissionCapabilities', () => ({
  resolveAgentPermissions: (...args: unknown[]) =>
    resolveAgentPermissions(...args),
}));

jest.mock('./agentErrors', () => ({
  toUserFacingAgentError: (error: unknown) => error,
}));

import type { IContext } from '~/connectionResolvers';
import type { IMastraAgent, IMastraAgentInput } from '@/agent/@types/agent';
import { agentMutations } from './agent';

const USER_ID = 'agent-user-1';

const profileInput = (overrides: Partial<IMastraAgentInput> = {}) => ({
  name: 'Sales Agent',
  description: 'Helps the sales team',
  instructions: 'Help the sales team',
  provider: 'provider-1',
  model: 'model-1',
  permissionGroupIds: ['group-1'],
  skills: [],
  destructiveOps: 'ask' as const,
  memoryEnabled: true,
  debug: false,
  maxSteps: 10,
  isActive: true,
  ...overrides,
});

const profileDocument = (overrides: Partial<IMastraAgent> = {}) => {
  const profile = {
    _id: USER_ID,
    instructions: 'Help the sales team',
    provider: 'provider-1',
    model: 'model-1',
    skills: [],
    destructiveOps: 'ask' as const,
    memoryEnabled: true,
    debug: false,
    maxSteps: 10,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
  return {
    ...profile,
    toObject: jest.fn(() => profile),
  };
};

const account = (overrides: Record<string, unknown> = {}) => ({
  _id: USER_ID,
  role: 'user',
  isOwner: false,
  isActive: true,
  appId: `erxes-agent:${USER_ID}`,
  permissionGroupIds: ['group-1'],
  details: {
    fullName: 'Sales Agent',
    description: 'Helps the sales team',
  },
  ...overrides,
});

const makeCtx = () => {
  const createAgent = jest.fn().mockResolvedValue(profileDocument());
  const updateAgent = jest.fn().mockResolvedValue(profileDocument());
  const getAgent = jest.fn().mockResolvedValue(profileDocument());
  const removeAgent = jest.fn().mockResolvedValue({ acknowledged: true });
  const deleteOne = jest.fn().mockResolvedValue({ acknowledged: true });
  const ctx = {
    models: {
      MastraAgent: {
        createAgent,
        updateAgent,
        getAgent,
        removeAgent,
        deleteOne,
      },
    },
    user: { _id: 'owner-1', isOwner: true },
    subdomain: 'os',
    checkPermission: jest.fn().mockResolvedValue(undefined),
  } as unknown as IContext;
  return {
    ctx,
    createAgent,
    updateAgent,
    getAgent,
    removeAgent,
    deleteOne,
  };
};

beforeEach(() => {
  canGroup.mockReset().mockResolvedValue(true);
  createAgentAccount.mockReset().mockResolvedValue(account());
  updateAgentAccount.mockReset().mockResolvedValue(account());
  deactivateAgentAccount.mockReset().mockResolvedValue(undefined);
  resolveAgentPermissions
    .mockReset()
    .mockImplementation(
      ({ permissionGroupIds }: { permissionGroupIds: string[] }) =>
        Promise.resolve({
          permissions: [],
          foundGroupIds: permissionGroupIds,
        }),
    );
});

describe('AI team member account lifecycle', () => {
  it('creates one core account and stores only the AI profile under its id', async () => {
    const { ctx, createAgent } = makeCtx();

    const result = await agentMutations.mastraAgentCreate(
      undefined,
      {
        doc: profileInput({
          permissionGroupIds: [' group-1 ', 'group-2', 'group-1'],
        }),
      },
      ctx,
    );

    expect(createAgentAccount).toHaveBeenCalledWith({
      subdomain: 'os',
      input: {
        name: 'Sales Agent',
        description: 'Helps the sales team',
        permissionGroupIds: ['group-1', 'group-2'],
        isActive: true,
      },
    });
    expect(createAgent).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        instructions: 'Help the sales team',
        provider: 'provider-1',
        model: 'model-1',
      }),
    );
    expect(createAgent.mock.calls[0][1]).not.toHaveProperty('name');
    expect(createAgent.mock.calls[0][1]).not.toHaveProperty('description');
    expect(createAgent.mock.calls[0][1]).not.toHaveProperty(
      'permissionGroupIds',
    );
    expect(result).toEqual(
      expect.objectContaining({
        _id: USER_ID,
        accountName: 'Sales Agent',
        accountDescription: 'Helps the sales team',
        permissionGroupIds: ['group-1'],
        isActive: true,
      }),
    );
  });

  it('deactivates the new account and deletes a partial profile when profile creation fails', async () => {
    const { ctx, createAgent, deleteOne } = makeCtx();
    createAgent.mockRejectedValue(new Error('profile unavailable'));

    await expect(
      agentMutations.mastraAgentCreate(undefined, { doc: profileInput() }, ctx),
    ).rejects.toThrow('profile unavailable');

    expect(deactivateAgentAccount).toHaveBeenCalledWith({
      userId: USER_ID,
      subdomain: 'os',
    });
    expect(deleteOne).toHaveBeenCalledWith({ _id: USER_ID });
  });

  it('updates account permissions and profile behavior through their owning stores', async () => {
    const { ctx, updateAgent } = makeCtx();
    updateAgentAccount
      .mockResolvedValueOnce(account())
      .mockResolvedValueOnce(
        account({ permissionGroupIds: ['group-1', 'group-2'] }),
      );

    await agentMutations.mastraAgentUpdate(
      undefined,
      {
        _id: USER_ID,
        doc: profileInput({
          name: 'Revenue Agent',
          permissionGroupIds: ['group-1', 'group-2'],
          maxSteps: 12,
        }),
      },
      ctx,
    );

    expect(updateAgentAccount).toHaveBeenNthCalledWith(2, {
      userId: USER_ID,
      subdomain: 'os',
      input: expect.objectContaining({
        name: 'Revenue Agent',
        permissionGroupIds: ['group-1', 'group-2'],
      }),
    });
    expect(updateAgent).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ maxSteps: 12 }),
    );
    expect(updateAgent.mock.calls[0][1]).not.toHaveProperty('name');
    expect(updateAgent.mock.calls[0][1]).not.toHaveProperty(
      'permissionGroupIds',
    );
  });

  it('requires Manage Permissions before assigning account groups', async () => {
    canGroup.mockResolvedValue(false);
    const { ctx, createAgent } = makeCtx();

    await expect(
      agentMutations.mastraAgentCreate(undefined, { doc: profileInput() }, ctx),
    ).rejects.toThrow(/Manage Permissions/i);

    expect(resolveAgentPermissions).not.toHaveBeenCalled();
    expect(createAgentAccount).not.toHaveBeenCalled();
    expect(createAgent).not.toHaveBeenCalled();
  });

  it('rejects missing permission groups before creating either record', async () => {
    resolveAgentPermissions.mockResolvedValue({
      permissions: [],
      foundGroupIds: ['group-1'],
    });
    const { ctx, createAgent } = makeCtx();

    await expect(
      agentMutations.mastraAgentCreate(
        undefined,
        {
          doc: profileInput({
            permissionGroupIds: ['group-1', 'missing-group'],
          }),
        },
        ctx,
      ),
    ).rejects.toThrow(/missing-group/);

    expect(createAgentAccount).not.toHaveBeenCalled();
    expect(createAgent).not.toHaveBeenCalled();
  });

  it('deactivates the canonical account before deleting its AI profile', async () => {
    const { ctx, getAgent, removeAgent } = makeCtx();

    await agentMutations.mastraAgentRemove(undefined, { _id: USER_ID }, ctx);

    expect(getAgent).toHaveBeenCalledWith(USER_ID);
    expect(deactivateAgentAccount).toHaveBeenCalledWith({
      userId: USER_ID,
      subdomain: 'os',
    });
    expect(removeAgent).toHaveBeenCalledWith(USER_ID);
    expect(deactivateAgentAccount.mock.invocationCallOrder[0]).toBeLessThan(
      removeAgent.mock.invocationCallOrder[0],
    );
  });
});
