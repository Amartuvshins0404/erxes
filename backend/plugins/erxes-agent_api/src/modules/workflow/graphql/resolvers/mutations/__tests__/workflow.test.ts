// Ownership + enable-time validation for workflow mutations. Every workflow is
// owned by an agent: create REQUIRES an existing one, and a schedule-triggered
// workflow may only be enabled when THAT agent's background preconditions hold
// (app token configured, owner resolvable, destructiveOps not 'allow'). The
// heavy mastra modules are mocked so these tests stay on the resolver logic.
jest.mock('~/mastra/workflows/runtime', () => ({ runWorkflow: jest.fn() }));
jest.mock('~/mastra/workflows/envelope', () => ({
  buildManualEnvelope: jest.fn(),
}));
jest.mock('~/mastra/tools/operationRegistry', () => ({
  getOperationRegistry: jest.fn(() => Promise.resolve({ operations: new Map() })),
}));
jest.mock('~/mastra/workflows/dsl', () => ({
  // The registry validation is not what these tests exercise — always pass.
  validateDefinition: jest.fn(() => ({ ok: true, errors: [] })),
}));

import { workflowMutations } from '../workflow';

const APP_TOKEN = 'sk_app-token';

type Agent = {
  agentId: string;
  ownerUserId?: string;
  createdBy?: string;
  destructiveOps?: 'allow' | 'ask' | 'block';
} | null;

/** A workflow definition — only the trigger type matters to the enable gate. */
const manualDef = () => ({ trigger: { type: 'manual', config: {} } });
const scheduleDef = () => ({
  trigger: { type: 'schedule', config: { cron: '0 3 * * *' } },
});

/**
 * A context double. `agent` is what MastraAgent.findOne resolves (null =
 * not found); `appToken` seeds Agent settings' erxesApiToken.
 */
const makeCtx = (agent: Agent, appToken?: string) => {
  const createWorkflow = jest.fn((doc: unknown) =>
    Promise.resolve({ _id: 'wf-1', version: 1, ...(doc as object) }),
  );
  const setEnabled = jest.fn().mockResolvedValue({ _id: 'wf-1' });
  const updateWorkflow = jest.fn((_id: string, doc: unknown) =>
    Promise.resolve({ _id, version: 2, ...(doc as object) }),
  );
  const getWorkflow = jest.fn();
  const getSettings = jest.fn().mockResolvedValue({ erxesApiToken: appToken });
  return {
    createWorkflow,
    setEnabled,
    updateWorkflow,
    getWorkflow,
    ctx: {
      models: {
        MastraAgent: { findOne: jest.fn().mockResolvedValue(agent) },
        MastraSettings: { getSettings },
        MastraWorkflow: {
          createWorkflow,
          setEnabled,
          updateWorkflow,
          getWorkflow,
        },
      },
      user: { _id: 'u1' },
      checkPermission: jest.fn().mockResolvedValue(undefined),
      subdomain: 'os',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
};

describe('mastraWorkflowCreate ownership', () => {
  it('rejects creating a workflow with no agentId', async () => {
    const { ctx, createWorkflow } = makeCtx({ agentId: 'a1', createdBy: 'u1' });
    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { doc: { name: 'w', definition: manualDef() } as any },
        ctx,
      ),
    ).rejects.toThrow(/owning agent/i);
    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('rejects creating a workflow whose agent does not exist', async () => {
    const { ctx, createWorkflow } = makeCtx(null);
    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { doc: { name: 'w', agentId: 'ghost', definition: manualDef() } as any },
        ctx,
      ),
    ).rejects.toThrow(/not found/i);
    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('creates a workflow with a valid owning agent, stamping the creator', async () => {
    const { ctx, createWorkflow } = makeCtx({ agentId: 'a1', createdBy: 'u1' });
    await workflowMutations.mastraWorkflowCreate(
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { doc: { name: 'w', agentId: 'a1', definition: manualDef() } as any },
      ctx,
    );
    expect(createWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'a1', createdByUserId: 'u1' }),
    );
  });

  it('rejects creating an ENABLED schedule workflow when the app token is unset', async () => {
    const { ctx, createWorkflow } = makeCtx({ agentId: 'a1', createdBy: 'u1' });
    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          doc: { name: 'w', agentId: 'a1', isEnabled: true, definition: scheduleDef() } as any,
        },
        ctx,
      ),
    ).rejects.toThrow(/erxes app token/i);
    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it("rejects an enabled schedule workflow whose owning agent is destructiveOps 'allow'", async () => {
    const { ctx, createWorkflow } = makeCtx(
      { agentId: 'a1', createdBy: 'u1', destructiveOps: 'allow' },
      APP_TOKEN,
    );
    await expect(
      workflowMutations.mastraWorkflowCreate(
        undefined,
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          doc: { name: 'w', agentId: 'a1', isEnabled: true, definition: scheduleDef() } as any,
        },
        ctx,
      ),
    ).rejects.toThrow(/destructiveOps/);
    expect(createWorkflow).not.toHaveBeenCalled();
  });

  it('creates an enabled schedule workflow once the owning agent + app token check out', async () => {
    const { ctx, createWorkflow } = makeCtx(
      { agentId: 'a1', createdBy: 'u1', destructiveOps: 'ask' },
      APP_TOKEN,
    );
    await workflowMutations.mastraWorkflowCreate(
      undefined,
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc: { name: 'w', agentId: 'a1', isEnabled: true, definition: scheduleDef() } as any,
      },
      ctx,
    );
    expect(createWorkflow).toHaveBeenCalledTimes(1);
  });
});

describe('mastraWorkflowUpdate ownership', () => {
  it('rejects reassigning to a nonexistent agent', async () => {
    const { ctx, updateWorkflow } = makeCtx(null);
    await expect(
      workflowMutations.mastraWorkflowUpdate(
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: 'wf-1', doc: { agentId: 'ghost' } as any },
        ctx,
      ),
    ).rejects.toThrow(/not found/i);
    expect(updateWorkflow).not.toHaveBeenCalled();
  });
});

describe('mastraWorkflowSetEnabled', () => {
  it('rejects enabling a schedule workflow that has no owning agent', async () => {
    const { ctx, setEnabled, getWorkflow } = makeCtx(null);
    getWorkflow.mockResolvedValue({
      _id: 'wf-1',
      agentId: undefined,
      definition: scheduleDef(),
    });
    await expect(
      workflowMutations.mastraWorkflowSetEnabled(
        undefined,
        { _id: 'wf-1', isEnabled: true },
        ctx,
      ),
    ).rejects.toThrow(/no owning agent/i);
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('enables a schedule workflow when its owning agent clears the preconditions', async () => {
    const { ctx, setEnabled, getWorkflow } = makeCtx(
      { agentId: 'a1', createdBy: 'u1', destructiveOps: 'ask' },
      APP_TOKEN,
    );
    getWorkflow.mockResolvedValue({
      _id: 'wf-1',
      agentId: 'a1',
      definition: scheduleDef(),
    });
    await workflowMutations.mastraWorkflowSetEnabled(
      undefined,
      { _id: 'wf-1', isEnabled: true },
      ctx,
    );
    expect(setEnabled).toHaveBeenCalledWith('wf-1', true);
  });

  it('allows disabling regardless of ownership', async () => {
    const { ctx, setEnabled } = makeCtx(null);
    await workflowMutations.mastraWorkflowSetEnabled(
      undefined,
      { _id: 'wf-1', isEnabled: false },
      ctx,
    );
    expect(setEnabled).toHaveBeenCalledWith('wf-1', false);
  });
});
