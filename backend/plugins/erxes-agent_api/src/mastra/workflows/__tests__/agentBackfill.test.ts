// The boot-time backfill that gives legacy workflows an owning agent. These
// tests pin the deterministic assignment order (binding → creator → tenant →
// disable) and idempotency. Mongo is mocked — the module's tenant enumeration
// (backfillWorkflowAgents) is exercised separately from the pure per-tenant
// logic (backfillTenantWorkflows), which takes models directly.
// The module imports generateModels + erxes-api-shared/utils at load time (used
// only by the tenant-enumerating backfillWorkflowAgents); stub them so the pure
// per-tenant logic under test doesn't drag the ESM-shipping module graph in.
jest.mock('../../../connectionResolvers', () => ({ generateModels: jest.fn() }));
jest.mock('erxes-api-shared/utils', () => ({
  getEnv: jest.fn(() => ''),
  getSaasOrganizations: jest.fn(() => []),
}));

import { backfillTenantWorkflows } from '../agentBackfill';

/** A stored agent, as MastraAgent.find/findOne return it. */
interface Agent {
  _id: string;
  agentId: string;
  isEnabled?: boolean;
  ownerUserId?: string;
  createdBy?: string;
  createdAt?: Date;
}

/** A stored workflow missing (or carrying) an agentId. */
interface Workflow {
  _id: string;
  agentId?: string;
  isEnabled?: boolean;
  createdByUserId?: string;
  definition?: {
    bindings?: Record<string, { kind: string; id: string }>;
  };
}

/**
 * A tiny in-memory models double. `find`/`findOne` honor the subset of the
 * Mongo query the backfill actually issues; `.sort()` is chainable and applied
 * to the filtered result so oldest-first determinism is exercised.
 */
const makeModels = (workflows: Workflow[], agents: Agent[]) => {
  const updateOne = jest.fn(() => Promise.resolve({ acknowledged: true }));

  const matchesAgent = (a: Agent, q: Record<string, unknown>): boolean => {
    if (q.isEnabled !== undefined && a.isEnabled !== q.isEnabled) return false;
    if (q._id && typeof q._id === 'object') {
      const inList = (q._id as { $in: string[] }).$in;
      if (!inList.includes(a._id)) return false;
    }
    if (q.$or) {
      const ok = (q.$or as Array<Record<string, unknown>>).some((clause) =>
        Object.entries(clause).every(
          ([k, v]) => (a as Record<string, unknown>)[k] === v,
        ),
      );
      if (!ok) return false;
    }
    return true;
  };

  const sortable = (rows: Agent[]) => ({
    sort: () =>
      Promise.resolve(
        [...rows].sort(
          (x, y) =>
            (x.createdAt?.getTime() ?? 0) - (y.createdAt?.getTime() ?? 0) ||
            x._id.localeCompare(y._id),
        )[0] ?? null,
      ),
  });

  return {
    updateOne,
    models: {
      MastraWorkflow: {
        // Only the "missing agentId" branch is queried by the backfill.
        find: jest.fn(() =>
          Promise.resolve(workflows.filter((w) => !w.agentId)),
        ),
        updateOne,
      },
      MastraAgent: {
        find: jest.fn((q: Record<string, unknown> = {}) =>
          Promise.resolve(agents.filter((a) => matchesAgent(a, q))),
        ),
        findOne: jest.fn((q: Record<string, unknown> = {}) =>
          sortable(agents.filter((a) => matchesAgent(a, q))),
        ),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
};

describe('backfillTenantWorkflows', () => {
  it('rule (a): assigns the single agent referenced in the definition bindings', async () => {
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'wf-1',
          createdByUserId: 'u1',
          definition: { bindings: { judge: { kind: 'agent', id: 'A_id' } } },
        },
      ],
      [
        { _id: 'A_id', agentId: 'agent-A', isEnabled: true },
        { _id: 'B_id', agentId: 'agent-B', isEnabled: true },
      ],
    );

    await backfillTenantWorkflows(models);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'wf-1' },
      { $set: { agentId: 'agent-A' } },
    );
  });

  it('rule (a) does NOT apply when bindings reference two distinct agents', async () => {
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'wf-1',
          createdByUserId: 'u1',
          definition: {
            bindings: {
              a: { kind: 'agent', id: 'A_id' },
              b: { kind: 'agent', id: 'B_id' },
            },
          },
        },
      ],
      [
        // Two referenced agents → ambiguous → fall through to the creator rule,
        // which resolves to the creator's oldest enabled agent (agent-C).
        { _id: 'A_id', agentId: 'agent-A', isEnabled: true },
        { _id: 'B_id', agentId: 'agent-B', isEnabled: true },
        {
          _id: 'C_id',
          agentId: 'agent-C',
          isEnabled: true,
          createdBy: 'u1',
          createdAt: new Date('2020-01-01'),
        },
      ],
    );

    await backfillTenantWorkflows(models);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'wf-1' },
      { $set: { agentId: 'agent-C' } },
    );
  });

  it("rule (b): assigns the creator's oldest enabled agent (deterministic)", async () => {
    const { models, updateOne } = makeModels(
      [{ _id: 'wf-1', createdByUserId: 'u1', definition: { bindings: {} } }],
      [
        {
          _id: 'newer',
          agentId: 'agent-new',
          isEnabled: true,
          ownerUserId: 'u1',
          createdAt: new Date('2022-01-01'),
        },
        {
          _id: 'older',
          agentId: 'agent-old',
          isEnabled: true,
          createdBy: 'u1',
          createdAt: new Date('2020-01-01'),
        },
        // A disabled agent of the same creator must be ignored.
        {
          _id: 'disabled',
          agentId: 'agent-off',
          isEnabled: false,
          createdBy: 'u1',
          createdAt: new Date('2019-01-01'),
        },
      ],
    );

    await backfillTenantWorkflows(models);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'wf-1' },
      { $set: { agentId: 'agent-old' } },
    );
  });

  it("rule (c): falls back to the tenant's oldest enabled agent", async () => {
    const { models, updateOne } = makeModels(
      // Creator has no agents of their own.
      [{ _id: 'wf-1', createdByUserId: 'ghost', definition: { bindings: {} } }],
      [
        {
          _id: 'a2',
          agentId: 'agent-2',
          isEnabled: true,
          createdBy: 'someone',
          createdAt: new Date('2021-06-01'),
        },
        {
          _id: 'a1',
          agentId: 'agent-1',
          isEnabled: true,
          createdBy: 'someone',
          createdAt: new Date('2021-01-01'),
        },
      ],
    );

    await backfillTenantWorkflows(models);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'wf-1' },
      { $set: { agentId: 'agent-1' } },
    );
  });

  it('rule (d): no assignable agent → leaves unassigned and disables an enabled workflow', async () => {
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'wf-1',
          isEnabled: true,
          createdByUserId: 'u1',
          definition: { bindings: {} },
        },
      ],
      [], // no agents at all in the tenant
    );

    await backfillTenantWorkflows(models);

    // Never assigns an agentId; only disables the live workflow.
    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'wf-1' },
      { $set: { isEnabled: false } },
    );
    expect(updateOne).not.toHaveBeenCalledWith(
      { _id: 'wf-1' },
      expect.objectContaining({ $set: expect.objectContaining({ agentId: expect.anything() }) }),
    );
  });

  it('rule (d): a disabled unassignable workflow is left completely untouched', async () => {
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'wf-1',
          isEnabled: false,
          createdByUserId: 'u1',
          definition: { bindings: {} },
        },
      ],
      [],
    );

    await backfillTenantWorkflows(models);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('is idempotent: workflows that already have an agentId are skipped', async () => {
    const { models, updateOne } = makeModels(
      [
        {
          _id: 'wf-owned',
          agentId: 'agent-existing',
          createdByUserId: 'u1',
          definition: { bindings: {} },
        },
      ],
      [
        {
          _id: 'a1',
          agentId: 'agent-1',
          isEnabled: true,
          createdBy: 'u1',
          createdAt: new Date('2020-01-01'),
        },
      ],
    );

    await backfillTenantWorkflows(models);
    // The find() double already excludes owned workflows, and nothing is written.
    expect(updateOne).not.toHaveBeenCalled();
  });
});
