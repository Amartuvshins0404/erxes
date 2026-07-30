// The background workflow entry point resolves its principal from the workflow's
// OWNING AGENT (step 24) and fails CLOSED — recording a failed run without
// executing — when there is no owning agent, the agent is missing, or the
// AI team-member token can't be minted. resolveAgentPrincipal is mocked so
// these tests pin the fail-closed branches and verify the owning agent passed.
const resolveAgentPrincipal = jest.fn();
jest.mock('../../auth/backgroundPrincipal', () => ({
  resolveAgentPrincipal: (...args: unknown[]) => resolveAgentPrincipal(...args),
}));

import { runBackgroundWorkflow } from '../runtime';

import type { IModels } from '../../../connectionResolvers';
import type { IMastraWorkflowDocument } from '@/workflow/@types/workflow';
const envelope = { source: 'schedule', type: 'schedule', payload: {} } as never;

/**
 * The profile lookup resolves the workflow's plugin profile. Account identity
 * and activity are enforced by resolveAgentPrincipal against core.
 */
const makeModels = (agent: Record<string, unknown> | null) => {
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
      MastraWorkflowRun: { createRun },
    } as unknown as IModels,
  };
};

const workflow = (over: Record<string, unknown> = {}) =>
  ({
    _id: 'wf-1',
    version: 1,
    agentId: 'agent-A',
    isEnabled: true,
    approvalStatus: 'approved',
    definition: { trigger: { type: 'schedule' } },
    ...over,
  } as unknown as IMastraWorkflowDocument);

describe('runBackgroundWorkflow fail-closed', () => {
  beforeEach(() => resolveAgentPrincipal.mockReset());

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
    expect(resolveAgentPrincipal).not.toHaveBeenCalled();
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
    expect(resolveAgentPrincipal).not.toHaveBeenCalled();
  });

  it('fails closed when the owning team-member account is inactive', async () => {
    const agent = {
      _id: 'agent-user-1',
      isActive: true,
    };
    const { models } = makeModels(agent);
    resolveAgentPrincipal.mockResolvedValue({
      ok: false,
      error:
        'Background run refused: the owning AI team-member account is inactive',
    });

    const rec = await runBackgroundWorkflow({
      models,
      subdomain: 'os',
      workflow: workflow({ agentId: 'agent-user-1' }),
      envelope,
    });
    expect(rec.status).toBe('failed');
    expect(rec.error).toMatch(/account is inactive/i);
    expect(resolveAgentPrincipal).toHaveBeenCalledWith(
      expect.objectContaining({ agentConfig: agent, background: true }),
    );
  });

  it('resolves the principal from the OWNING AGENT config and fails closed on mint failure', async () => {
    const agent = {
      _id: 'agent-A',
    };
    const { models } = makeModels(agent);
    resolveAgentPrincipal.mockResolvedValue({
      ok: false,
      error:
        "Background run refused: could not mint a run token for the agent's AI team member",
    });

    const rec = await runBackgroundWorkflow({
      models,
      subdomain: 'os',
      workflow: workflow(),
      envelope,
    });

    // The owning profile — not a createdByUserId or app-token shim — is passed.
    expect(resolveAgentPrincipal).toHaveBeenCalledWith({
      agentConfig: agent,
      models,
      subdomain: 'os',
      background: true,
    });
    expect(rec.status).toBe('failed');
    expect(rec.error).toMatch(/could not mint/i);
  });
});
