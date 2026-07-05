// Enable-time validation for scheduled agent runs: a schedule may only be
// ENABLED when the secure owner-token path is configured and the agent does not
// run destructive ops unattended. runSchedule is mocked so the resolver imports
// stay lightweight (no @mastra agent runtime pulled in).
jest.mock('~/mastra/schedules/runner', () => ({ runSchedule: jest.fn() }));

import { scheduleMutations } from '../schedule';

const SECRET = 'shared-run-secret';

type Agent = {
  agentId: string;
  ownerUserId?: string;
  createdBy?: string;
  destructiveOps?: 'allow' | 'ask' | 'block';
};

const makeCtx = (agent: Agent | null) => {
  const createSchedule = jest.fn((doc: unknown) => Promise.resolve(doc));
  const setEnabled = jest.fn().mockResolvedValue({});
  const getSchedule = jest.fn().mockResolvedValue({
    _id: 's1',
    agentId: agent?.agentId ?? 'a1',
    isEnabled: false,
  });
  return {
    ctx: {
      models: {
        MastraAgent: { findOne: jest.fn().mockResolvedValue(agent) },
        MastraSchedule: { createSchedule, setEnabled, getSchedule },
      },
      user: { _id: 'u1' },
      checkPermission: jest.fn().mockResolvedValue(undefined),
      subdomain: 'os',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    createSchedule,
    setEnabled,
  };
};

const baseDoc = (isEnabled: boolean) => ({
  name: 'nightly',
  agentId: 'a1',
  cron: '0 3 * * *',
  prompt: 'go',
  isEnabled,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

afterEach(() => {
  delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
});

describe('mastraScheduleCreate enable-time validation', () => {
  it('rejects creating an enabled schedule when the run-token secret is unset', async () => {
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
    const { ctx, createSchedule } = makeCtx({
      agentId: 'a1',
      createdBy: 'u1',
    });

    await expect(
      scheduleMutations.mastraScheduleCreate(undefined, { doc: baseDoc(true) }, ctx),
    ).rejects.toThrow(/ERXES_AGENT_RUN_TOKEN_SECRET/);
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('rejects creating an enabled schedule when the agent has no owner', async () => {
    process.env.ERXES_AGENT_RUN_TOKEN_SECRET = SECRET;
    const { ctx, createSchedule } = makeCtx({ agentId: 'a1' });

    await expect(
      scheduleMutations.mastraScheduleCreate(undefined, { doc: baseDoc(true) }, ctx),
    ).rejects.toThrow(/owner is unset/i);
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it("rejects an enabled schedule whose agent is destructiveOps: 'allow'", async () => {
    process.env.ERXES_AGENT_RUN_TOKEN_SECRET = SECRET;
    const { ctx, createSchedule } = makeCtx({
      agentId: 'a1',
      createdBy: 'u1',
      destructiveOps: 'allow',
    });

    await expect(
      scheduleMutations.mastraScheduleCreate(undefined, { doc: baseDoc(true) }, ctx),
    ).rejects.toThrow(/destructiveOps/);
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('creates an enabled schedule when secret + owner present and destructive is gated', async () => {
    process.env.ERXES_AGENT_RUN_TOKEN_SECRET = SECRET;
    const { ctx, createSchedule } = makeCtx({
      agentId: 'a1',
      createdBy: 'u1',
      destructiveOps: 'ask',
    });

    await scheduleMutations.mastraScheduleCreate(
      undefined,
      { doc: baseDoc(true) },
      ctx,
    );
    expect(createSchedule).toHaveBeenCalledTimes(1);
  });

  it('creates a DISABLED schedule without the background preconditions', async () => {
    // No secret, no owner — but disabled schedules never fire, so only the agent
    // must exist.
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
    const { ctx, createSchedule } = makeCtx({ agentId: 'a1' });

    await scheduleMutations.mastraScheduleCreate(
      undefined,
      { doc: baseDoc(false) },
      ctx,
    );
    expect(createSchedule).toHaveBeenCalledTimes(1);
  });
});

describe('mastraScheduleSetEnabled validation', () => {
  it('rejects enabling when the secure background path is unconfigured', async () => {
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
    const { ctx, setEnabled } = makeCtx({ agentId: 'a1' });

    await expect(
      scheduleMutations.mastraScheduleSetEnabled(
        undefined,
        { _id: 's1', isEnabled: true },
        ctx,
      ),
    ).rejects.toThrow(/ERXES_AGENT_RUN_TOKEN_SECRET/);
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('allows DISABLING regardless of configuration', async () => {
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
    const { ctx, setEnabled } = makeCtx({ agentId: 'a1' });

    await scheduleMutations.mastraScheduleSetEnabled(
      undefined,
      { _id: 's1', isEnabled: false },
      ctx,
    );
    expect(setEnabled).toHaveBeenCalledWith('s1', false);
  });
});
