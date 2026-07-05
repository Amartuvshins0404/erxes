// Enable-time validation for scheduled agent runs: a schedule may only be
// ENABLED when the secure path is configured (the erxes app token in Agent
// settings) and the agent does not run destructive ops unattended. Since step 22
// the schedule runs as the agent's SERVICE USER, so a human owner is no longer a
// precondition. runSchedule is mocked so the resolver imports stay lightweight
// (no @mastra agent runtime pulled in).
jest.mock('~/mastra/schedules/runner', () => ({ runSchedule: jest.fn() }));

import { scheduleMutations } from '../schedule';

const APP_TOKEN = 'sk_app-token';

type Agent = {
  agentId: string;
  ownerUserId?: string;
  createdBy?: string;
  destructiveOps?: 'allow' | 'ask' | 'block';
};

// `appToken` seeds Agent settings' erxesApiToken — undefined = the secure path
// is not configured.
const makeCtx = (agent: Agent | null, appToken?: string) => {
  const createSchedule = jest.fn((doc: unknown) => Promise.resolve(doc));
  const setEnabled = jest.fn().mockResolvedValue({});
  const getSchedule = jest.fn().mockResolvedValue({
    _id: 's1',
    agentId: agent?.agentId ?? 'a1',
    isEnabled: false,
  });
  const getSettings = jest
    .fn()
    .mockResolvedValue({ erxesApiToken: appToken });
  return {
    ctx: {
      models: {
        MastraAgent: { findOne: jest.fn().mockResolvedValue(agent) },
        MastraSchedule: { createSchedule, setEnabled, getSchedule },
        MastraSettings: { getSettings },
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

describe('mastraScheduleCreate enable-time validation', () => {
  it('rejects creating an enabled schedule when the app token is unconfigured', async () => {
    const { ctx, createSchedule } = makeCtx({
      agentId: 'a1',
      createdBy: 'u1',
    });

    await expect(
      scheduleMutations.mastraScheduleCreate(undefined, { doc: baseDoc(true) }, ctx),
    ).rejects.toThrow(/erxes app token/i);
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('creates an enabled schedule for an OWNER-LESS agent (new: runs as the service user)', async () => {
    // No ownerUserId / createdBy on the agent — before step 22 this was rejected
    // ("owner is unset"). Now the schedule runs as the agent's service user, so
    // the app token alone (with destructive gated) is enough to enable it.
    const { ctx, createSchedule } = makeCtx({ agentId: 'a1' }, APP_TOKEN);

    await scheduleMutations.mastraScheduleCreate(
      undefined,
      { doc: baseDoc(true) },
      ctx,
    );
    expect(createSchedule).toHaveBeenCalledTimes(1);
  });

  it("rejects an enabled schedule whose agent is destructiveOps: 'allow'", async () => {
    const { ctx, createSchedule } = makeCtx(
      { agentId: 'a1', createdBy: 'u1', destructiveOps: 'allow' },
      APP_TOKEN,
    );

    await expect(
      scheduleMutations.mastraScheduleCreate(undefined, { doc: baseDoc(true) }, ctx),
    ).rejects.toThrow(/destructiveOps/);
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it('creates an enabled schedule when the app token is present and destructive is gated', async () => {
    const { ctx, createSchedule } = makeCtx(
      { agentId: 'a1', createdBy: 'u1', destructiveOps: 'ask' },
      APP_TOKEN,
    );

    await scheduleMutations.mastraScheduleCreate(
      undefined,
      { doc: baseDoc(true) },
      ctx,
    );
    expect(createSchedule).toHaveBeenCalledTimes(1);
  });

  it('creates a DISABLED schedule without the background preconditions', async () => {
    // No app token — but disabled schedules never fire, so only the agent must
    // exist.
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
    const { ctx, setEnabled } = makeCtx({ agentId: 'a1' });

    await expect(
      scheduleMutations.mastraScheduleSetEnabled(
        undefined,
        { _id: 's1', isEnabled: true },
        ctx,
      ),
    ).rejects.toThrow(/erxes app token/i);
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('allows DISABLING regardless of configuration', async () => {
    const { ctx, setEnabled } = makeCtx({ agentId: 'a1' });

    await scheduleMutations.mastraScheduleSetEnabled(
      undefined,
      { _id: 's1', isEnabled: false },
      ctx,
    );
    expect(setEnabled).toHaveBeenCalledWith('s1', false);
  });
});
