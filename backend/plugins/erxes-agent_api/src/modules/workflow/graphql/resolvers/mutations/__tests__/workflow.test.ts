const requireScopedWorkflow = jest.fn();
const requireScopedWorkflowAgent = jest.fn();
jest.mock('@/workflow/authorization', () => ({
  requireScopedWorkflow: (...args: unknown[]) => requireScopedWorkflow(...args),
  requireScopedWorkflowAgent: (...args: unknown[]) =>
    requireScopedWorkflowAgent(...args),
}));

const assertWorkflowSchedulable = jest.fn();
jest.mock('~/mastra/auth/backgroundPrincipal', () => ({
  assertWorkflowSchedulable: (...args: unknown[]) =>
    assertWorkflowSchedulable(...args),
}));

const syncTenantSchedules = jest.fn();
jest.mock('~/mastra/scheduleSync', () => ({
  syncTenantSchedules: (...args: unknown[]) => syncTenantSchedules(...args),
}));

const runWorkflow = jest.fn();
jest.mock('~/mastra/workflows/runtime', () => ({
  runWorkflow: (...args: unknown[]) => runWorkflow(...args),
}));

const buildManualEnvelope = jest.fn();
jest.mock('~/mastra/workflows/envelope', () => ({
  buildManualEnvelope: (...args: unknown[]) => buildManualEnvelope(...args),
}));

jest.mock('~/mastra/requestContext', () => ({
  runWithAuth: (_auth: unknown, run: () => unknown) => run(),
}));

jest.mock('~/mastra/tools/operationRegistry', () => ({
  getOperationRegistry: jest.fn(() =>
    Promise.resolve({ operations: new Map() }),
  ),
}));

jest.mock('~/mastra/workflows/dsl', () => ({
  validateDefinition: jest.fn(() => ({ ok: true, errors: [] })),
}));

import type { IContext } from '~/connectionResolvers';
import type { IMastraWorkflow } from '@/workflow/@types/workflow';
import { workflowMutations } from '../workflow';

const definition = {
  trigger: { type: 'manual', config: {} },
  steps: [],
};

const workflow = (
  overrides: Partial<IMastraWorkflow> = {},
): IMastraWorkflow => ({
  _id: 'workflow-1',
  name: 'Workflow',
  agentId: 'agent-1',
  definition,
  isEnabled: false,
  approvalStatus: 'draft',
  ...overrides,
});

const makeContext = () => {
  const createWorkflow = jest.fn().mockResolvedValue(workflow());
  const updateWorkflow = jest.fn().mockResolvedValue(workflow());
  const approveWorkflow = jest
    .fn()
    .mockResolvedValue(workflow({ approvalStatus: 'approved' }));
  const setEnabled = jest
    .fn()
    .mockResolvedValue(
      workflow({ approvalStatus: 'approved', isEnabled: true }),
    );
  const checkPermission = jest.fn().mockResolvedValue(undefined);
  const models = {
    MastraWorkflow: {
      createWorkflow,
      updateWorkflow,
      approveWorkflow,
      setEnabled,
    },
    MastraSettings: {
      getSettings: jest.fn().mockResolvedValue({}),
    },
  };
  const context = {
    models,
    user: { _id: 'user-1' },
    subdomain: 'tenant',
    checkPermission,
  } as unknown as IContext;

  return {
    approveWorkflow,
    checkPermission,
    context,
    createWorkflow,
    models,
    setEnabled,
    updateWorkflow,
  };
};

beforeEach(() => {
  requireScopedWorkflow.mockReset();
  requireScopedWorkflowAgent.mockReset();
  assertWorkflowSchedulable.mockReset();
  syncTenantSchedules.mockReset();
  runWorkflow.mockReset();
  buildManualEnvelope.mockReset();

  requireScopedWorkflowAgent.mockResolvedValue({
    agent: { agentId: 'agent-1', isEnabled: true },
    scope: 'own',
  });
  requireScopedWorkflow.mockResolvedValue(workflow());
  buildManualEnvelope.mockReturnValue({ input: {} });
});

describe('mastraWorkflowCreate', () => {
  it('requires an owning agent', async () => {
    const { context, createWorkflow } = makeContext();

    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        { doc: workflow({ agentId: '' }) },
        context,
      ),
    ).rejects.toThrow(/owning agent/i);

    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('rejects a disabled owning agent', async () => {
    requireScopedWorkflowAgent.mockResolvedValue({
      agent: { agentId: 'agent-1', isEnabled: false },
      scope: 'own',
    });
    const { context, createWorkflow } = makeContext();

    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        { doc: workflow() },
        context,
      ),
    ).rejects.toThrow(/disabled/i);

    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('always creates a disabled draft owned by the caller', async () => {
    const { context, createWorkflow } = makeContext();

    await workflowMutations.mastraWorkflowCreate(
      undefined,
      {
        doc: workflow({
          agentId: ' agent-1 ',
          isEnabled: true,
          approvalStatus: 'approved',
        }),
      },
      context,
    );

    expect(createWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'agent-1',
        isEnabled: false,
        approvalStatus: 'draft',
        createdByUserId: 'user-1',
      }),
    );
  });
});

describe('mastraWorkflowUpdate', () => {
  it('rejects direct approval and schedule changes', async () => {
    const { context, updateWorkflow } = makeContext();

    await expect(
      workflowMutations.mastraWorkflowUpdate(
        undefined,
        { _id: 'workflow-1', doc: { isEnabled: true } },
        context,
      ),
    ).rejects.toThrow(/dedicated actions/i);

    expect(updateWorkflow).not.toHaveBeenCalled();
  });

  it('updates an authorized draft and resynchronizes schedules', async () => {
    const { context, models, updateWorkflow } = makeContext();

    await workflowMutations.mastraWorkflowUpdate(
      undefined,
      { _id: 'workflow-1', doc: { name: 'Renamed' } },
      context,
    );

    expect(requireScopedWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'erxesAgentWorkflowsUpdateDraft',
        workflowId: 'workflow-1',
      }),
    );
    expect(updateWorkflow).toHaveBeenCalledWith('workflow-1', {
      name: 'Renamed',
    });
    expect(syncTenantSchedules).toHaveBeenCalledWith(models, 'tenant');
  });
});

describe('workflow approval and execution', () => {
  it('approves only after validating background execution preconditions', async () => {
    const reviewedAt = new Date('2026-01-02T03:04:05.000Z');
    const approved = {
      ...workflow({ approvalStatus: 'draft', version: 7 }),
      updatedAt: reviewedAt,
    };
    requireScopedWorkflow.mockResolvedValue(approved);
    const { approveWorkflow, context, models } = makeContext();

    await workflowMutations.mastraWorkflowApprove(
      undefined,
      { _id: 'workflow-1' },
      context,
    );

    expect(assertWorkflowSchedulable).toHaveBeenCalledWith({
      models,
      agentId: 'agent-1',
      definition,
    });
    expect(approveWorkflow).toHaveBeenCalledWith(
      'workflow-1',
      'user-1',
      7,
      reviewedAt,
    );
  });

  it('surfaces a compare-and-set rejection when the reviewed version changed', async () => {
    const reviewedAt = new Date('2026-02-03T04:05:06.000Z');
    const reviewed = {
      ...workflow({ approvalStatus: 'draft', version: 9 }),
      updatedAt: reviewedAt,
    };
    requireScopedWorkflow.mockResolvedValue(reviewed);
    const { approveWorkflow, context } = makeContext();
    approveWorkflow.mockRejectedValue(
      new Error('Workflow changed while it was being reviewed'),
    );

    await expect(
      workflowMutations.mastraWorkflowApprove(
        undefined,
        { _id: 'workflow-1' },
        context,
      ),
    ).rejects.toThrow(/changed while it was being reviewed/i);

    expect(approveWorkflow).toHaveBeenCalledWith(
      'workflow-1',
      'user-1',
      9,
      reviewedAt,
    );
  });

  it('does not enable a draft workflow', async () => {
    requireScopedWorkflow.mockResolvedValue(workflow());
    const { context, setEnabled } = makeContext();

    await expect(
      workflowMutations.mastraWorkflowSetEnabled(
        undefined,
        { _id: 'workflow-1', isEnabled: true },
        context,
      ),
    ).rejects.toThrow(/approved/i);

    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('enables an approved workflow after rechecking preconditions', async () => {
    requireScopedWorkflow.mockResolvedValue(
      workflow({ approvalStatus: 'approved' }),
    );
    const { context, models, setEnabled } = makeContext();

    await workflowMutations.mastraWorkflowSetEnabled(
      undefined,
      { _id: 'workflow-1', isEnabled: true },
      context,
    );

    expect(assertWorkflowSchedulable).toHaveBeenCalledWith({
      models,
      agentId: 'agent-1',
      definition,
    });
    expect(setEnabled).toHaveBeenCalledWith('workflow-1', true);
  });

  it('does not run a draft workflow', async () => {
    requireScopedWorkflow.mockResolvedValue(workflow());
    const { context } = makeContext();

    await expect(
      workflowMutations.mastraWorkflowRunStart(
        undefined,
        { _id: 'workflow-1' },
        context,
      ),
    ).rejects.toThrow(/approved/i);

    expect(runWorkflow).not.toHaveBeenCalled();
  });

  it('runs an approved workflow as the requesting user', async () => {
    const approved = workflow({ approvalStatus: 'approved' });
    requireScopedWorkflow.mockResolvedValue(approved);
    runWorkflow.mockResolvedValue({ _id: 'run-1', status: 'success' });
    const { context, models } = makeContext();

    await workflowMutations.mastraWorkflowRunStart(
      undefined,
      { _id: 'workflow-1', input: { source: 'manual' } },
      context,
    );

    expect(buildManualEnvelope).toHaveBeenCalledWith(
      { source: 'manual' },
      'user-1',
    );
    expect(runWorkflow).toHaveBeenCalledWith({
      models,
      subdomain: 'tenant',
      workflow: approved,
      envelope: { input: {} },
    });
  });
});
