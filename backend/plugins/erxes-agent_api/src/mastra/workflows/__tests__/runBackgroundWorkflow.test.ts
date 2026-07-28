// The background workflow entry point resolves its principal from the workflow's
// OWNING AGENT (step 24) and fails CLOSED — recording a failed run without
// executing — when there is no owning agent, the agent is missing, or the
// agent's service-user token can't be minted. resolveBackgroundPrincipal is
// mocked so these tests pin the fail-closed branches and that the owning agent's
// config (and models, for the service-user lifecycle) is what's passed.
const resolveBackgroundPrincipal = jest.fn();
jest.mock('../../auth/backgroundPrincipal', () => ({
  resolveBackgroundPrincipal: (...args: unknown[]) =>
    resolveBackgroundPrincipal(...args),
}));

import { runBackgroundWorkflow } from '../runtime';

const envelope = { source: 'schedule', type: 'schedule', payload: {} } as never;

/**
 * A models double capturing the failed-run record and the agent lookup. The
 * findOne is FILTER-AWARE: it honors the `isEnabled: true` clause the runtime
 * issues, so a disabled owning agent resolves to null (the kill switch) — a
 * blanket mock would hide that the query ever filtered on isEnabled.
 */
const makeModels = (
  agent: {
    isEnabled?: boolean;
    destructiveOps?: 'allow' | 'ask' | 'block';
  } | null,
) => {
  const createRun = jest.fn((doc: Record<string, unknown>) =>
    Promise.resolve({ _id: 'run-1', ...doc }),
  );
  const findOne = jest.fn((q: Record<string, unknown> = {}) => {
    if (!agent) return Promise.resolve(null);
    if (q.isEnabled === true && agent.isEnabled !== true)
      return Promise.resolve(null);
    return Promise.resolve(agent);
  });
  return {
    createRun,
    findOne,
    models: {
      MastraAgent: { findOne },
      MastraSettings: {
        getSettings: jest.fn().mockResolvedValue({ erxesApiToken: 'sk_app' }),
      },
      MastraWorkflowRun: { createRun },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
};

const workflow = (over: Record<string, unknown> = {}) =>
  ({
    _id: 'wf-1',
    version: 1,
    approvalStatus: 'approved',
    isEnabled: true,
    agentId: 'agent-A',
    definition: { trigger: { type: 'schedule' } },
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

describe('runBackgroundWorkflow fail-closed', () => {
  beforeEach(() => resolveBackgroundPrincipal.mockReset());

  it('records a failed run (no execution) when the workflow has no owning agent', async () => {
    const { models, createRun, findOne } = makeModels(null);
    const rec = await runBackgroundWorkflow({
      models,
      subdomain: 'os',
      workflow: workflow({ agentId: undefined }),
      envelope,
    });
    expect(rec.status).toBe('failed');
    expect(rec.error).toMatch(/no owning agent/i);
    // Never even looked up an agent or tried to mint a principal.
    expect(findOne).not.toHaveBeenCalled();
    expect(resolveBackgroundPrincipal).not.toHaveBeenCalled();
    expect(createRun).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the owning agent no longer exists', async () => {
    const { models } = makeModels(null);
    const rec = await runBackgroundWorkflow({
      models,
      subdomain: 'os',
      workflow: workflow({ agentId: 'gone' }),
      envelope,
    });
    expect(rec.status).toBe('failed');
    expect(rec.error).toMatch(/was not found/i);
    expect(resolveBackgroundPrincipal).not.toHaveBeenCalled();
  });

  it('fails closed when the owning agent is DISABLED (kill switch)', async () => {
    // The agent exists but isEnabled:false — the filter-aware findOne resolves it
    // to null exactly as the runtime's { isEnabled: true } query does, so the
    // background run is refused instead of running under a killed agent.
    const { models } = makeModels({
      agentId: 'agent-A',
      isEnabled: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const rec = await runBackgroundWorkflow({
      models,
      subdomain: 'os',
      workflow: workflow({ agentId: 'agent-A' }),
      envelope,
    });
    expect(rec.status).toBe('failed');
    expect(rec.error).toMatch(/not found or is disabled/i);
    expect(resolveBackgroundPrincipal).not.toHaveBeenCalled();
  });

  it('fails closed when the owning agent allows destructive operations', async () => {
    const { models } = makeModels({
      isEnabled: true,
      destructiveOps: 'allow',
    });

    const rec = await runBackgroundWorkflow({
      models,
      subdomain: 'os',
      workflow: workflow(),
      envelope,
    });

    expect(rec.status).toBe('failed');
    expect(rec.error).toMatch(/destructive operations/i);
    expect(resolveBackgroundPrincipal).not.toHaveBeenCalled();
  });

  it('resolves the principal from the OWNING AGENT config and fails closed on mint failure', async () => {
    const agent = {
      agentId: 'agent-A',
      isEnabled: true,
      serviceUserId: 'svc-1',
      createdBy: 'u1',
    };
    const { models } = makeModels(agent);
    resolveBackgroundPrincipal.mockResolvedValue({
      ok: false,
      error:
        "Background run refused: could not mint a run token for the agent's service user",
    });

    const rec = await runBackgroundWorkflow({
      models,
      subdomain: 'os',
      workflow: workflow(),
      envelope,
    });

    // The owning agent's config (+ models, for the service-user lifecycle) — not
    // a createdByUserId shim — is what's passed.
    expect(resolveBackgroundPrincipal).toHaveBeenCalledWith(
      expect.objectContaining({
        agentConfig: agent,
        subdomain: 'os',
        appToken: 'sk_app',
        models,
      }),
    );
    expect(rec.status).toBe('failed');
    expect(rec.error).toMatch(/could not mint/i);
  });
});
