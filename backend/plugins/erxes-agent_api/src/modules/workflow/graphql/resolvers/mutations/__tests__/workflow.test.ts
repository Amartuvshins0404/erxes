class ExpectedError extends Error {}

jest.mock('erxes-api-shared/utils', () => ({ ExpectedError }));
const runWorkflow = jest.fn();
jest.mock('~/mastra/workflows/runtime', () => ({
  runWorkflow: (...args: unknown[]) => runWorkflow(...args),
}));
const buildManualEnvelope = jest.fn();
jest.mock('~/mastra/workflows/envelope', () => ({
  buildManualEnvelope: (...args: unknown[]) => buildManualEnvelope(...args),
}));
const runWithAuth = jest.fn((_authCtx: unknown, execute: () => unknown) =>
  execute(),
);
jest.mock('~/mastra/requestContext', () => ({
  runWithAuth: (...args: [unknown, () => unknown]) => runWithAuth(...args),
}));
jest.mock('~/mastra/tools/operationRegistry', () => ({
  getOperationRegistry: jest.fn(() =>
    Promise.resolve({ operations: new Map() }),
  ),
}));
jest.mock('~/mastra/workflows/dsl', () => ({
  validateDefinition: jest.fn(() => ({ ok: true, errors: [] })),
}));

const assertWorkflowSchedulable = jest.fn();
const resolveAgentPrincipal = jest.fn();
jest.mock('~/mastra/auth/backgroundPrincipal', () => ({
  assertWorkflowSchedulable: (...args: unknown[]) =>
    assertWorkflowSchedulable(...args),
  resolveAgentPrincipal: (...args: unknown[]) => resolveAgentPrincipal(...args),
}));

const getAgentAccount = jest.fn();
jest.mock('~/mastra/auth/servicePrincipal', () => ({
  getAgentAccount: (...args: unknown[]) => getAgentAccount(...args),
}));

const syncTenantSchedules = jest.fn();
jest.mock('~/mastra/scheduleSync', () => ({
  syncTenantSchedules: (...args: unknown[]) => syncTenantSchedules(...args),
}));

import type { IContext } from '~/connectionResolvers';
import type { IMastraWorkflow } from '@/workflow/@types/workflow';
import { workflowMutations } from '../workflow';

const manualDefinition = { trigger: { type: 'manual', config: {} } };
const scheduleDefinition = {
  trigger: { type: 'schedule', config: { cron: '0 3 * * *' } },
} as unknown as IMastraWorkflow['definition'];

const workflowDoc = (
  overrides: Partial<IMastraWorkflow> = {},
): IMastraWorkflow =>
  ({
    name: 'Daily review',
    agentId: 'agent-user-1',
    definition: manualDefinition,
    isEnabled: false,
    ...overrides,
  } as IMastraWorkflow);

const makeCtx = (profileExists = true) => {
  const findOne = jest
    .fn()
    .mockResolvedValue(profileExists ? { _id: 'agent-user-1' } : null);
  const createWorkflow = jest.fn((doc: IMastraWorkflow) =>
    Promise.resolve({ _id: 'workflow-1', version: 1, ...doc }),
  );
  const updateWorkflow = jest.fn((_id: string, doc: Partial<IMastraWorkflow>) =>
    Promise.resolve({ _id, version: 2, ...doc }),
  );
  const removeWorkflow = jest.fn().mockResolvedValue({ deletedCount: 1 });
  const setEnabled = jest
    .fn()
    .mockResolvedValue({ _id: 'workflow-1', isEnabled: true });
  const getWorkflow = jest.fn().mockResolvedValue(workflowDoc());
  const getSettings = jest
    .fn()
    .mockResolvedValue({ erxesApiToken: 'app-token' });
  const models = {
    MastraAgent: { findOne },
    MastraSettings: { getSettings },
    MastraWorkflow: {
      createWorkflow,
      updateWorkflow,
      removeWorkflow,
      setEnabled,
      getWorkflow,
    },
  };
  const ctx = {
    models,
    user: { _id: 'human-1' },
    checkPermission: jest.fn().mockResolvedValue(undefined),
    subdomain: 'os',
  } as unknown as IContext;
  return {
    ctx,
    models,
    findOne,
    createWorkflow,
    updateWorkflow,
    removeWorkflow,
    setEnabled,
    getWorkflow,
  };
};

beforeEach(() => {
  assertWorkflowSchedulable.mockReset().mockResolvedValue(undefined);
  const authCtx = {
    token: 'agent-run-token',
    userHeader: 'encoded-agent-user',
    principalUserId: 'agent-user-1',
    subdomain: 'os',
    background: false,
    agentId: 'agent-user-1',
  };
  resolveAgentPrincipal.mockReset().mockResolvedValue({ ok: true, authCtx });
  buildManualEnvelope.mockReset().mockReturnValue({ source: 'manual' });
  runWorkflow.mockReset().mockResolvedValue({ _id: 'run-1' });
  runWithAuth.mockClear();
  getAgentAccount.mockReset().mockResolvedValue({
    _id: 'agent-user-1',
    role: 'user',
    isOwner: false,
    isActive: true,
    appId: 'erxes-agent:agent-user-1',
    permissionGroupIds: ['group-1'],
  });
  syncTenantSchedules.mockReset().mockResolvedValue(undefined);
});

describe('workflow AI team-member ownership', () => {
  it('requires an owning AI team member on create', async () => {
    const { ctx, createWorkflow } = makeCtx();

    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        { doc: workflowDoc({ agentId: undefined }) },
        ctx,
      ),
    ).rejects.toThrow(/owning AI team member/i);
    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('rejects an owner without an AI profile', async () => {
    const { ctx, createWorkflow } = makeCtx(false);

    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        { doc: workflowDoc() },
        ctx,
      ),
    ).rejects.toThrow(/not found/i);
    expect(getAgentAccount).not.toHaveBeenCalled();
    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('uses account deactivation as the workflow ownership kill switch', async () => {
    getAgentAccount.mockRejectedValue(new Error('inactive'));
    const { ctx, createWorkflow } = makeCtx();

    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        { doc: workflowDoc() },
        ctx,
      ),
    ).rejects.toThrow(/missing or inactive/i);
    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('creates under the canonical account id and stamps the human creator', async () => {
    const { ctx, models, createWorkflow } = makeCtx();

    await workflowMutations.mastraWorkflowCreate(
      undefined,
      { doc: workflowDoc() },
      ctx,
    );

    expect(createWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'agent-user-1',
        createdByUserId: 'human-1',
      }),
    );
    expect(syncTenantSchedules).toHaveBeenCalledWith(models, 'os');
  });

  it('checks background preconditions before creating an enabled schedule', async () => {
    const { ctx, models, createWorkflow } = makeCtx();
    const doc = workflowDoc({
      definition: scheduleDefinition,
      isEnabled: true,
    });

    await workflowMutations.mastraWorkflowCreate(undefined, { doc }, ctx);

    expect(assertWorkflowSchedulable).toHaveBeenCalledWith({
      models,
      subdomain: 'os',
      agentId: 'agent-user-1',
      definition: scheduleDefinition,
    });
    expect(createWorkflow).toHaveBeenCalled();
  });

  it('validates a reassigned canonical owner before updating', async () => {
    const { ctx, updateWorkflow } = makeCtx();
    getAgentAccount.mockResolvedValue({
      _id: 'agent-user-2',
      role: 'user',
      isActive: true,
      appId: 'erxes-agent:agent-user-2',
      permissionGroupIds: ['group-2'],
    });

    await workflowMutations.mastraWorkflowUpdate(
      undefined,
      { _id: 'workflow-1', doc: { agentId: 'agent-user-2' } },
      ctx,
    );

    expect(getAgentAccount).toHaveBeenCalledWith({
      userId: 'agent-user-2',
      subdomain: 'os',
    });
    expect(updateWorkflow).toHaveBeenCalledWith('workflow-1', {
      agentId: 'agent-user-2',
    });
  });

  it('checks the owning account before enabling and always allows disabling', async () => {
    const { ctx, models, getWorkflow, setEnabled } = makeCtx();
    getWorkflow.mockResolvedValue(
      workflowDoc({ definition: scheduleDefinition, isEnabled: false }),
    );

    await workflowMutations.mastraWorkflowSetEnabled(
      undefined,
      { _id: 'workflow-1', isEnabled: true },
      ctx,
    );

    expect(assertWorkflowSchedulable).toHaveBeenCalledWith({
      models,
      subdomain: 'os',
      agentId: 'agent-user-1',
      definition: scheduleDefinition,
    });
    expect(setEnabled).toHaveBeenCalledWith('workflow-1', true);

    assertWorkflowSchedulable.mockClear();
    getWorkflow.mockClear();
    await workflowMutations.mastraWorkflowSetEnabled(
      undefined,
      { _id: 'workflow-1', isEnabled: false },
      ctx,
    );
    expect(getWorkflow).not.toHaveBeenCalled();
    expect(assertWorkflowSchedulable).not.toHaveBeenCalled();
    expect(setEnabled).toHaveBeenCalledWith('workflow-1', false);
  });

  it('runs a manual workflow as its AI team-member owner', async () => {
    const { ctx, models, findOne, getWorkflow } = makeCtx();
    const ownerProfile = { _id: 'agent-user-1' };
    findOne.mockResolvedValue(ownerProfile);
    const workflow = workflowDoc();
    getWorkflow.mockResolvedValue(workflow);

    const result = await workflowMutations.mastraWorkflowRunStart(
      undefined,
      { _id: 'workflow-1', input: { ticketId: 'ticket-1' } },
      ctx,
    );

    expect(resolveAgentPrincipal).toHaveBeenCalledWith({
      agentConfig: ownerProfile,
      subdomain: 'os',
      background: false,
    });
    expect(buildManualEnvelope).toHaveBeenCalledWith(
      { ticketId: 'ticket-1' },
      'human-1',
    );
    expect(runWithAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        principalUserId: 'agent-user-1',
        background: false,
      }),
      expect.any(Function),
    );
    expect(runWorkflow).toHaveBeenCalledWith({
      models,
      subdomain: 'os',
      workflow,
      envelope: { source: 'manual' },
    });
    expect(result).toEqual({ _id: 'run-1' });
  });

  it('refuses a manual workflow when its owner principal cannot be minted', async () => {
    const { ctx } = makeCtx();
    resolveAgentPrincipal.mockResolvedValue({
      ok: false,
      error: 'Agent run refused: owner account is inactive',
    });

    await expect(
      workflowMutations.mastraWorkflowRunStart(
        undefined,
        { _id: 'workflow-1' },
        ctx,
      ),
    ).rejects.toThrow(/owner account is inactive/i);
    expect(runWithAuth).not.toHaveBeenCalled();
    expect(runWorkflow).not.toHaveBeenCalled();
  });

  it('removes a workflow and resynchronizes schedules', async () => {
    const { ctx, models, removeWorkflow } = makeCtx();

    await workflowMutations.mastraWorkflowRemove(
      undefined,
      { _id: 'workflow-1' },
      ctx,
    );

    expect(removeWorkflow).toHaveBeenCalledWith('workflow-1');
    expect(syncTenantSchedules).toHaveBeenCalledWith(models, 'os');
  });
});
