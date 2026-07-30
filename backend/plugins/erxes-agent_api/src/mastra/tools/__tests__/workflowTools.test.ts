/**
 * Builder-tool tests. Mongo, the operation registry, and the Mastra engine are
 * all mocked — these tests cover the tool contracts: validation gating before
 * save, the simulate trace/assumption mechanics, and tenant-scoped reads.
 */
import { mockWorkflowsModule } from '../../workflows/__tests__/mockWorkflowEngine';

jest.mock('@mastra/core/workflows', () => mockWorkflowsModule());
jest.mock('@mastra/core/tools', () => ({
  createTool: (cfg: unknown) => cfg,
}));

/** The auth context shape the mocked requestContext serves. */
interface MockAuth {
  subdomain?: string;
  userHeader?: string;
  token?: string;
  agentId?: string;
}

// Default: an authenticated team member (userHeader present) whose turn is being
// run by agent 'agent-self' — the workflows they build default to owning it.
// Individual tests flip this to simulate the anonymous bot path.
const mockAuth: { current: MockAuth | undefined } = {
  current: {
    subdomain: 'os',
    userHeader: Buffer.from('{"_id":"u1"}').toString('base64'),
    agentId: 'agent-self',
  },
};
jest.mock('../../requestContext', () => ({
  getCurrentAuth: () => mockAuth.current,
}));

const mockGetWorkflowAgentAccess = jest.fn();
const mockRequireScopedWorkflow = jest.fn();
const mockRequireScopedWorkflowAgent = jest.fn();
jest.mock('@/workflow/authorization', () => ({
  getWorkflowAgentAccess: (...args: unknown[]) =>
    mockGetWorkflowAgentAccess(...args),
  requireScopedWorkflow: (...args: unknown[]) =>
    mockRequireScopedWorkflow(...args),
  requireScopedWorkflowAgent: (...args: unknown[]) =>
    mockRequireScopedWorkflowAgent(...args),
}));

interface MockAgentSettings {
  erxesApiUrl: string;
  erxesApiToken?: string;
}

const mockGetSettings = jest.fn(
  (): Promise<MockAgentSettings> =>
    Promise.resolve({ erxesApiUrl: 'https://gw' }),
);
const mockCreateWorkflow = jest.fn((doc: Record<string, unknown>) =>
  Promise.resolve({
    _id: 'wf-1',
    version: 1,
    ...doc,
  }),
);
const mockGetWorkflows = jest.fn(() => Promise.resolve([]));
const mockGetRuns = jest.fn(() => Promise.resolve([]));
// Owning-agent profile lookup plus active-account verification.
// Default: both exist and the account is active. Individual tests use setAgent
// to model a missing profile or an inactive core account.
type MockAgent = {
  _id?: string;
  agentId: string;
  isEnabled?: boolean;
  createdBy?: string;
  destructiveOps?: 'allow' | 'ask' | 'block';
} | null;
// The canonical profile and core account are represented together in this
// harness. Production verifies the profile by `_id`, then verifies that its
// same-ID service-user account is active.
let storedAgent: MockAgent = {
  _id: 'agent-self',
  agentId: 'agent-self',
  isEnabled: true,
  createdBy: 'u1',
};
const setAgent = (agent: MockAgent) => {
  storedAgent = agent
    ? {
        ...agent,
        _id: agent._id ?? agent.agentId,
        isEnabled: agent.isEnabled ?? true,
      }
    : null;
};
const mockAgentFindOne = jest.fn<Promise<MockAgent>, [Record<string, unknown>]>(
  (query: Record<string, unknown> = {}) => {
    if (!storedAgent || query._id !== storedAgent._id) {
      return Promise.resolve(null);
    }
    return Promise.resolve(storedAgent);
  },
);
const mockGetAgentAccount = jest.fn(
  ({ userId }: { userId: string }) =>
    storedAgent?._id === userId && storedAgent.isEnabled
      ? Promise.resolve({
          _id: userId,
          isActive: true,
          permissionGroupIds: ['group-1'],
          customPermissions: [],
        })
      : Promise.reject(new Error('Agent account not found or inactive')),
);
jest.mock('../../auth/servicePrincipal', () => ({
  getAgentAccount: (opts: { userId: string }) => mockGetAgentAccount(opts),
}));
// Existing-workflow reads for the update tool's schedule-enable gate; each test
// sets the stored shape (isEnabled/owner/definition) it needs.
const mockGetWorkflow = jest.fn();
const mockUpdateWorkflow = jest.fn(
  (_id: string, patch: Record<string, unknown>) =>
    Promise.resolve({ _id, version: 2, ...patch }),
);
const mockSetEnabled = jest.fn((_id: string, isEnabled: boolean) =>
  Promise.resolve({ _id, version: 2, isEnabled }),
);

jest.mock('../../../connectionResolvers', () => ({
  generateModels: jest.fn(() =>
    Promise.resolve({
      MastraSettings: { getSettings: mockGetSettings },
      MastraWorkflow: {
        createWorkflow: mockCreateWorkflow,
        getWorkflows: mockGetWorkflows,
        getWorkflow: mockGetWorkflow,
        updateWorkflow: mockUpdateWorkflow,
        setEnabled: mockSetEnabled,
      },
      MastraAgent: { findOne: mockAgentFindOne },
      MastraWorkflowRun: { getRuns: mockGetRuns },
    }),
  ),
}));

jest.mock('../operationRegistry', () => ({
  getOperationRegistry: jest.fn(() => {
    const ops = [
      {
        operation: 'dealsAdd',
        operationType: 'mutation',
        plugin: 'sales',
        module: 'deals',
      },
      {
        operation: 'customers',
        operationType: 'query',
        plugin: 'core',
        module: 'customers',
      },
    ];
    return Promise.resolve({
      operations: new Map(ops.map((o) => [o.operation, o])),
      list: ops,
      inputTypesMap: {},
      objectFieldsMap: {},
      enumValuesMap: {},
    });
  }),
}));

import {
  workflowValidateTool,
  workflowSimulateTool,
  workflowSaveTool,
  workflowUpdateTool,
  workflowGuideTool,
  workflowRunNowTool,
  workflowListTool,
  workflowRunsTool,
} from '../workflowTools';

/** One structured validation error as the tools report it. */
interface ToolValidationError {
  path: string;
  message: string;
}

/** Result of workflowValidate. */
interface ValidateResult {
  ok: boolean;
  errors: ToolValidationError[];
  instruction?: string;
}

/** One simulate-trace event. */
interface SimTraceEvent {
  step: string;
  stepId?: string;
  operation?: string;
  args?: Record<string, unknown>;
  prompt?: string;
  output?: Record<string, unknown>;
  assumed?: boolean;
}

/** Result of workflowSimulate. */
interface SimulateResult {
  success: boolean;
  status?: string;
  trace: SimTraceEvent[];
  output?: { taken?: string };
  errors?: ToolValidationError[];
  error?: string;
}

/** Result of workflowSave. */
interface SaveResult {
  success: boolean;
  workflowId?: string;
  version?: number;
  errors?: ToolValidationError[];
  error?: string;
}

/**
 * The mocked createTool returns its raw config, so each tool's execute is
 * directly callable — this narrows a tool to that callable surface.
 */
const asTool = <TResult>(tool: unknown) =>
  tool as { execute: (input: Record<string, unknown>) => Promise<TResult> };

/** A freely mutable draft step — tests rewrite arbitrary fields on it. */
interface DraftStep {
  id: string;
  type: string;
  [key: string]: unknown;
}

/** A freely mutable draft definition the tools receive as plain JSON. */
interface DraftDefinition {
  trigger: { type: string; config: Record<string, unknown> };
  policy: { mode: string; allowed: string[] };
  bindings: Record<string, { kind: string; id: string }>;
  limits: { maxLlmCalls: number };
  steps: DraftStep[];
}

const definition = (): DraftDefinition => ({
  trigger: { type: 'manual', config: {} },
  policy: { mode: 'all', allowed: [] },
  bindings: { judge: { kind: 'agent', id: 'agent-1' } },
  limits: { maxLlmCalls: 10 },
  steps: [
    {
      id: 'classify',
      type: 'agent',
      agentRef: 'judge',
      prompt: '{{trigger.payload.text}}',
      outputSchema: { intent: 'enum:order,question' },
    },
    {
      id: 'route',
      type: 'branch',
      branches: [
        {
          when: "{{steps.classify.output.intent}} == 'order'",
          steps: [
            {
              id: 'createDeal',
              type: 'operation',
              operation: 'dealsAdd',
              args: { name: 'x' },
            },
          ],
        },
      ],
      else: [
        { id: 'lookup', type: 'operation', operation: 'customers', args: {} },
      ],
    },
    {
      id: 'done',
      type: 'end',
      output: { taken: '{{steps.route.output.taken}}' },
    },
  ],
});

/** Narrows a draft step to the branch shape for targeted mutation. */
const asBranchStep = (step: unknown) =>
  step as { branches: Array<{ steps: Array<{ operation: string }> }> };

/**
 * A minimal VALID schedule-triggered definition — the unattended-cron shape the
 * background-run enable gate protects. `over` patches top-level fields (e.g.
 * destructiveOps) for the individual cases.
 */
const scheduleDefinition = (
  over: Partial<DraftDefinition> = {},
): DraftDefinition => ({
  trigger: { type: 'schedule', config: { cron: '0 9 * * *' } },
  policy: { mode: 'all', allowed: [] },
  bindings: {},
  limits: { maxLlmCalls: 10 },
  steps: [
    { id: 'lookup', type: 'operation', operation: 'customers', args: {} },
  ],
  ...over,
});

/** Result of workflowUpdate. */
interface UpdateResult {
  success: boolean;
  version?: number;
  errors?: ToolValidationError[];
  error?: string;
}

beforeEach(() => {
  mockGetWorkflowAgentAccess.mockReset();
  mockRequireScopedWorkflow.mockReset();
  mockRequireScopedWorkflowAgent.mockReset();
  mockGetAgentAccount.mockClear();

  mockGetWorkflowAgentAccess.mockResolvedValue({
    scope: 'own',
    agentIds: ['agent-self'],
  });
  mockRequireScopedWorkflow.mockResolvedValue({
    _id: 'wf-1',
    version: 1,
    approvalStatus: 'approved',
    isEnabled: false,
    agentId: 'agent-self',
    definition: definition(),
  });
  mockRequireScopedWorkflowAgent.mockResolvedValue({
    agent: { agentId: 'agent-self', isEnabled: true },
    scope: 'own',
  });
});

describe('team-member gate (anonymous bot path)', () => {
  afterEach(() => {
    mockAuth.current = {
      subdomain: 'os',
      userHeader: Buffer.from('{"_id":"u1"}').toString('base64'),
      agentId: 'agent-self',
    };
  });

  it('denies every builder tool when no userHeader is on the auth context', async () => {
    // The frontline bot webhook runs with { token, subdomain } but NO
    // userHeader — a customer must not reach these tools.
    mockAuth.current = { subdomain: 'os', token: 'app-token' };

    const denial = /only available to logged-in team members/;
    // The guide tool's execute is synchronous up to the gate, so it throws
    // rather than rejecting.
    expect(() => asTool(workflowGuideTool).execute({})).toThrow(denial);
    await expect(asTool(workflowListTool).execute({})).rejects.toThrow(denial);
    await expect(
      asTool(workflowSaveTool).execute({
        name: 'x',
        definition: definition(),
        enable: true,
      }),
    ).rejects.toThrow(denial);
    await expect(
      asTool(workflowRunNowTool).execute({ workflowId: 'wf-1', payload: {} }),
    ).rejects.toThrow(denial);
    expect(mockCreateWorkflow).not.toHaveBeenCalled();
  });

  it('denies even with no auth context at all', async () => {
    mockAuth.current = undefined;
    await expect(asTool(workflowListTool).execute({})).rejects.toThrow(
      /only available to logged-in team members/,
    );
  });
});

describe('workflow builtin authorization', () => {
  beforeEach(() => {
    mockCreateWorkflow.mockClear();
    mockGetRuns.mockClear();
    mockGetWorkflows.mockClear();
    mockUpdateWorkflow.mockClear();
    mockGetSettings.mockResolvedValue({ erxesApiUrl: 'https://gw' });
  });

  it('lists only workflows owned by agents visible to the read action', async () => {
    mockGetWorkflowAgentAccess.mockResolvedValue({
      scope: 'own',
      agentIds: ['agent-self'],
    });

    await asTool<{ workflows: unknown[] }>(workflowListTool).execute({});

    expect(mockGetWorkflowAgentAccess).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'erxesAgentWorkflowsRead' }),
    );
    expect(mockGetWorkflows).toHaveBeenCalledWith({
      agentIds: ['agent-self'],
    });
  });

  it('fails closed instead of listing workflows without read capability', async () => {
    mockGetWorkflowAgentAccess.mockRejectedValue(
      new Error('Permission required'),
    );

    await expect(asTool(workflowListTool).execute({})).rejects.toThrow(
      /permission required/i,
    );
    expect(mockGetWorkflows).not.toHaveBeenCalled();
  });

  it('does not expose another workflow run history', async () => {
    mockRequireScopedWorkflow.mockRejectedValue(
      new Error('Workflow not found'),
    );

    await expect(
      asTool(workflowRunsTool).execute({ workflowId: 'other-workflow' }),
    ).rejects.toThrow(/workflow not found/i);
    expect(mockRequireScopedWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'erxesAgentWorkflowRunsRead',
        workflowId: 'other-workflow',
      }),
    );
    expect(mockGetRuns).not.toHaveBeenCalled();
  });

  it('does not save a workflow under an inaccessible agent', async () => {
    mockRequireScopedWorkflowAgent.mockRejectedValue(
      new Error('Workflow not found'),
    );

    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Cross-owner',
      agentId: 'other-agent',
      definition: definition(),
      enable: false,
    });

    expect(res.success).toBe(false);
    expect(mockRequireScopedWorkflowAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'erxesAgentWorkflowsCreateDraft',
        agentId: 'other-agent',
      }),
    );
    expect(mockCreateWorkflow).not.toHaveBeenCalled();
  });

  it('does not update another workflow', async () => {
    mockRequireScopedWorkflow.mockRejectedValue(
      new Error('Workflow not found'),
    );

    const res = await asTool<UpdateResult>(workflowUpdateTool).execute({
      workflowId: 'other-workflow',
      name: 'Nope',
    });

    expect(res.success).toBe(false);
    expect(mockRequireScopedWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'erxesAgentWorkflowsUpdateDraft',
        workflowId: 'other-workflow',
      }),
    );
    expect(mockUpdateWorkflow).not.toHaveBeenCalled();
  });

  it('does not run another workflow', async () => {
    mockRequireScopedWorkflow.mockRejectedValue(
      new Error('Workflow not found'),
    );

    const res = await asTool<SaveResult>(workflowRunNowTool).execute({
      workflowId: 'other-workflow',
      payload: {},
    });

    expect(res.success).toBe(false);
    expect(mockRequireScopedWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'erxesAgentWorkflowsRun',
        workflowId: 'other-workflow',
      }),
    );
  });

  it('does not run a scoped draft workflow', async () => {
    mockRequireScopedWorkflow.mockResolvedValue({
      _id: 'wf-1',
      version: 1,
      approvalStatus: 'draft',
      isEnabled: false,
      agentId: 'agent-self',
      definition: definition(),
    });

    const res = await asTool<SaveResult>(workflowRunNowTool).execute({
      workflowId: 'wf-1',
      payload: {},
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/approved/i);
  });

  it('requires a workflow draft capability before validating or simulating', async () => {
    mockGetWorkflowAgentAccess.mockRejectedValue(
      new Error('Permission required'),
    );

    await expect(
      asTool(workflowValidateTool).execute({ definition: definition() }),
    ).rejects.toThrow(/permission required/i);

    const simulated = await asTool<SimulateResult>(
      workflowSimulateTool,
    ).execute({
      definition: definition(),
    });
    expect(simulated.success).toBe(false);
    expect(simulated.error).toMatch(/permission required/i);
  });
});

describe('workflowGuideTool', () => {
  it('documents every supported step type and the ref/condition syntax', async () => {
    const { guide } = await asTool<{ guide: string }>(
      workflowGuideTool,
    ).execute({});
    for (const must of [
      'operation',
      'agent',
      'branch',
      'parallel',
      'wait',
      'end',
      '{{trigger.payload',
      'workflowValidate',
    ]) {
      expect(guide).toContain(must);
    }
    // Unsupported steps are explicitly fenced off.
    expect(guide).toMatch(/approval[\s\S]*NOT supported yet/);
  });
});

describe('workflowValidateTool', () => {
  it('passes a valid definition against the live registry', async () => {
    const res = await asTool<ValidateResult>(workflowValidateTool).execute({
      definition: definition(),
    });
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
    // The save-now nudge: without it models end the turn after validation
    // and the workflow never gets created.
    expect(res.instruction).toMatch(/workflowSave NOW/);
  });

  it('reports nonexistent operations with structured errors', async () => {
    const def = definition();
    asBranchStep(def.steps[1]).branches[0].steps[0].operation = 'ghostOp';
    const res = await asTool<ValidateResult>(workflowValidateTool).execute({
      definition: def,
    });
    expect(res.ok).toBe(false);
    expect(res.errors[0].message).toMatch(/does not exist/);
  });
});

describe('workflowSimulateTool', () => {
  it('routes through the branch using assumptions and traces operations without side effects', async () => {
    const res = await asTool<SimulateResult>(workflowSimulateTool).execute({
      definition: definition(),
      triggerPayload: { text: 'I want to buy' },
      assumptions: { classify: { intent: 'order' } },
    });

    expect(res.success).toBe(true);
    const agentEvents = res.trace.filter((event) => event.step === 'agent');
    expect(agentEvents[0].assumed).toBe(true);
    expect(agentEvents[0].output).toEqual({ intent: 'order' });
    const opEvents = res.trace.filter((event) => event.step === 'operation');
    expect(opEvents.map((event) => event.operation)).toEqual(['dealsAdd']);
    expect(res.output?.taken).toMatch(/_route_b0$/);
    // No models writes happened.
    expect(mockCreateWorkflow).not.toHaveBeenCalled();
  });

  it('merges PARTIAL assumptions over auto-samples (the regression from live testing)', async () => {
    // A schema with a second required field — assuming only the routing
    // field must not fail the step's output validation.
    const def = definition();
    def.steps[0].outputSchema = {
      intent: 'enum:order,question',
      suggested_reply: 'string',
    };
    const res = await asTool<SimulateResult>(workflowSimulateTool).execute({
      definition: def,
      triggerPayload: { text: 'buy' },
      assumptions: { classify: { intent: 'order' } },
    });
    expect(res.success).toBe(true);
    const agentEvent = res.trace.find((event) => event.step === 'agent');
    expect(agentEvent?.output).toEqual({
      intent: 'order',
      suggested_reply: 'sample',
    });
  });

  it('auto-samples agent outputs when no assumption is given (else path)', async () => {
    const res = await asTool<SimulateResult>(workflowSimulateTool).execute({
      definition: definition(),
      triggerPayload: {},
    });
    expect(res.success).toBe(true);
    // sampleFor picks the first enum value 'order' → arm 0, traced dealsAdd.
    const agentEvents = res.trace.filter((event) => event.step === 'agent');
    expect(agentEvents[0].assumed).toBe(false);
    expect(agentEvents[0].output).toEqual({ intent: 'order' });
  });

  it('returns structured validation errors instead of running an invalid draft', async () => {
    const def = definition();
    def.steps[0].agentRef = 'ghost';
    const res = await asTool<SimulateResult>(workflowSimulateTool).execute({
      definition: def,
      triggerPayload: {},
    });
    expect(res.success).toBe(false);
    expect(res.errors?.length).toBeGreaterThan(0);
  });
});

describe('workflowSaveTool', () => {
  it('refuses to save an invalid definition', async () => {
    const def = definition();
    asBranchStep(def.steps[1]).branches[0].steps[0].operation = 'ghostOp';
    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Bad',
      definition: def,
    });
    expect(res.success).toBe(false);
    expect(mockCreateWorkflow).not.toHaveBeenCalled();
  });

  it('saves a valid definition disabled by default', async () => {
    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Support flow',
      definition: definition(),
      enable: false,
    });
    expect(res.success).toBe(true);
    expect(res.workflowId).toBe('wf-1');
    expect(mockCreateWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Support flow' }),
    );
    expect(mockCreateWorkflow.mock.calls[0][0]).not.toHaveProperty('isEnabled');
  });
});

/**
 * The agent-facing builder tools must apply the SAME enable-time gate the
 * GraphQL mutations do: an enabled schedule-triggered workflow is a live cron,
 * so it may only be enabled when the erxes app token (Agent settings) is present
 * and it doesn't run destructive ops unattended. Since step 22 the run executes
 * as the agent's service user, so no human owner is required. The tools surface
 * the refusal as a structured { success: false, error } result (not a thrown
 * 500) so the agent gets an actionable message.
 */
describe('schedule-enable gate (agent builder tools)', () => {
  const APP_TOKEN = 'sk_app-token';

  beforeEach(() => {
    // Default: no app token in Agent settings → secure path NOT configured.
    mockGetSettings.mockResolvedValue({ erxesApiUrl: 'https://gw' });
    mockCreateWorkflow.mockClear();
    mockUpdateWorkflow.mockClear();
    mockSetEnabled.mockClear();
    mockGetWorkflow.mockReset();
    // Default owning agent: exists, enabled, destructiveOps gated.
    mockAgentFindOne.mockClear();
    setAgent({ agentId: 'agent-self', createdBy: 'u1' });
  });

  afterEach(() => {
    // Restore the module-default settings + agent shapes for other suites.
    mockGetSettings.mockResolvedValue({ erxesApiUrl: 'https://gw' });
    setAgent({ agentId: 'agent-self', createdBy: 'u1' });
  });

  describe('workflowSaveTool', () => {
    it('refuses to enable a new workflow before human approval', async () => {
      const res = await asTool<SaveResult>(workflowSaveTool).execute({
        name: 'Nightly',
        definition: scheduleDefinition(),
        enable: true,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/approve/i);
      expect(mockCreateWorkflow).not.toHaveBeenCalled();
    });

    it('saves a schedule workflow as a disabled draft without an app token', async () => {
      const res = await asTool<SaveResult>(workflowSaveTool).execute({
        name: 'Nightly draft',
        definition: scheduleDefinition(),
        enable: false,
      });
      expect(res.success).toBe(true);
      expect(mockCreateWorkflow.mock.calls[0][0]).not.toHaveProperty(
        'isEnabled',
      );
    });
  });

  describe('workflowUpdateTool', () => {
    it('refuses to flip isEnabled on an existing schedule workflow without the app token', async () => {
      mockRequireScopedWorkflow.mockResolvedValue({
        _id: 'wf-1',
        isEnabled: false,
        agentId: 'agent-self',
        definition: scheduleDefinition(),
      });
      const res = await asTool<UpdateResult>(workflowUpdateTool).execute({
        workflowId: 'wf-1',
        enable: true,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/erxes app token/i);
      expect(mockUpdateWorkflow).not.toHaveBeenCalled();
    });

    it('returns edits to draft instead of treating an enabled workflow as still scheduled', async () => {
      mockRequireScopedWorkflow.mockResolvedValue({
        _id: 'wf-1',
        isEnabled: true,
        agentId: 'agent-self',
        definition: definition(),
      });
      const nextDefinition = scheduleDefinition();
      const res = await asTool<UpdateResult>(workflowUpdateTool).execute({
        workflowId: 'wf-1',
        definition: nextDefinition,
      });
      expect(res.success).toBe(true);
      expect(mockUpdateWorkflow).toHaveBeenCalledWith('wf-1', {
        definition: expect.objectContaining({
          trigger: nextDefinition.trigger,
          destructiveOps: 'block',
        }),
      });
      expect(mockSetEnabled).not.toHaveBeenCalled();
    });

    it('refuses to combine draft edits with enabling', async () => {
      const res = await asTool<UpdateResult>(workflowUpdateTool).execute({
        workflowId: 'wf-1',
        name: 'Edited',
        enable: true,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/approve/i);
      expect(mockUpdateWorkflow).not.toHaveBeenCalled();
      expect(mockSetEnabled).not.toHaveBeenCalled();
    });

    it('allows enabling a schedule workflow update once the app token is configured', async () => {
      mockGetSettings.mockResolvedValue({
        erxesApiUrl: 'https://gw',
        erxesApiToken: APP_TOKEN,
      });
      mockRequireScopedWorkflow.mockResolvedValue({
        _id: 'wf-1',
        isEnabled: false,
        agentId: 'agent-self',
        definition: scheduleDefinition(),
      });
      const res = await asTool<UpdateResult>(workflowUpdateTool).execute({
        workflowId: 'wf-1',
        enable: true,
      });
      expect(res.success).toBe(true);
      expect(res.version).toBe(2);
      expect(mockUpdateWorkflow).not.toHaveBeenCalled();
      expect(mockSetEnabled).toHaveBeenCalledWith('wf-1', true);
    });

    it('uses the dedicated schedule mutation when the update only disables', async () => {
      const res = await asTool<UpdateResult>(workflowUpdateTool).execute({
        workflowId: 'wf-1',
        enable: false,
      });
      expect(res.success).toBe(true);
      expect(mockUpdateWorkflow).not.toHaveBeenCalled();
      expect(mockSetEnabled).toHaveBeenCalledWith('wf-1', false);
    });
  });
});

/**
 * Every workflow is owned by an agent — its background identity. The builder
 * tools default ownership to the agent running the turn (getCurrentAuth().agentId)
 * and validate any explicit agentId exists before saving.
 */
describe('workflow ownership (agent builder tools)', () => {
  beforeEach(() => {
    mockCreateWorkflow.mockClear();
    mockUpdateWorkflow.mockClear();
    mockGetWorkflow.mockReset();
    mockAgentFindOne.mockClear();
    setAgent({ agentId: 'agent-self', createdBy: 'u1' });
    mockAuth.current = {
      subdomain: 'os',
      userHeader: Buffer.from('{"_id":"u1"}').toString('base64'),
      agentId: 'agent-self',
    };
  });

  afterEach(() => {
    mockAuth.current = {
      subdomain: 'os',
      userHeader: Buffer.from('{"_id":"u1"}').toString('base64'),
      agentId: 'agent-self',
    };
  });

  it('defaults ownership to the agent running the turn', async () => {
    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Mine',
      definition: definition(),
      enable: false,
    });
    expect(res.success).toBe(true);
    expect(mockAgentFindOne).toHaveBeenCalledWith({
      _id: 'agent-self',
    });
    expect(mockGetAgentAccount).toHaveBeenCalledWith({
      userId: 'agent-self',
      subdomain: 'os',
    });
    expect(mockRequireScopedWorkflowAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'erxesAgentWorkflowsCreateDraft',
        agentId: 'agent-self',
      }),
    );
    expect(mockCreateWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'agent-self' }),
    );
  });

  it('honors an explicit agentId (ownership handed to another agent)', async () => {
    setAgent({ agentId: 'agent-other', createdBy: 'u2' });
    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Handoff',
      agentId: 'agent-other',
      definition: definition(),
      enable: false,
    });
    expect(res.success).toBe(true);
    expect(mockAgentFindOne).toHaveBeenCalledWith({
      _id: 'agent-other',
    });
    expect(mockGetAgentAccount).toHaveBeenCalledWith({
      userId: 'agent-other',
      subdomain: 'os',
    });
    expect(mockCreateWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'agent-other' }),
    );
  });

  it('refuses to save when the referenced agent does not exist', async () => {
    setAgent(null);
    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Ghost',
      agentId: 'agent-ghost',
      definition: definition(),
      enable: false,
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not found/i);
    expect(mockCreateWorkflow).not.toHaveBeenCalled();
  });

  it('refuses to save when handing ownership to a DISABLED agent (kill switch)', async () => {
    // The canonical profile still exists, but its same-ID core account is
    // inactive, so ownership cannot be handed to it.
    setAgent({ agentId: 'agent-off', isEnabled: false, createdBy: 'u2' });
    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Handoff to disabled',
      agentId: 'agent-off',
      definition: definition(),
      enable: false,
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not found or disabled/i);
    expect(mockAgentFindOne).toHaveBeenCalledWith({
      _id: 'agent-off',
    });
    expect(mockGetAgentAccount).toHaveBeenCalledWith({
      userId: 'agent-off',
      subdomain: 'os',
    });
    expect(mockCreateWorkflow).not.toHaveBeenCalled();
  });

  it('refuses an update that reassigns ownership to a DISABLED agent', async () => {
    setAgent({ agentId: 'agent-off', isEnabled: false, createdBy: 'u2' });
    const res = await asTool<UpdateResult>(workflowUpdateTool).execute({
      workflowId: 'wf-1',
      agentId: 'agent-off',
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not found or disabled/i);
    expect(mockUpdateWorkflow).not.toHaveBeenCalled();
  });

  it('refuses to save when no agentId is given and the calling agent is unknown', async () => {
    // A logged-in team member, but the turn carries no agentId — the tool can't
    // guess an owner, so it refuses rather than saving an orphan workflow.
    mockAuth.current = {
      subdomain: 'os',
      userHeader: Buffer.from('{"_id":"u1"}').toString('base64'),
    };
    const res = await asTool<SaveResult>(workflowSaveTool).execute({
      name: 'Orphan',
      definition: definition(),
      enable: false,
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/owning agent/i);
    expect(mockCreateWorkflow).not.toHaveBeenCalled();
  });
});
