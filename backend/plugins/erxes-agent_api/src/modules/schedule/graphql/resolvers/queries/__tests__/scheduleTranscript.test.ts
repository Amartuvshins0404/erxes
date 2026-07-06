// Authorized-read contract for mastraScheduleTranscript. The linchpin: the read
// is gated by AGENT ACCESS (canUserAccessAgent), and the messages are read under
// the SCHEDULE's own background resource — never the viewer's. runner and
// mastraMemory are stubbed so the resolver imports stay lightweight (no @mastra
// runtime pulled in); nativeStore is mocked so we can assert exactly which
// resourceId the read was issued with.
jest.mock('~/mastra/schedules/runner', () => ({
  scheduleThreadId: (id: string) => `schedule-${id}`,
}));
jest.mock('~/mastra/memory/mastraMemory', () => ({
  scopedResource: (subdomain: string, resource: string) =>
    `${subdomain || 'os'}:${resource}`,
}));
jest.mock('@/session/nativeStore', () => ({
  getThreadMessagesByResource: jest.fn(),
}));

import { scheduleQueries } from '../schedule';
import { getThreadMessagesByResource } from '@/session/nativeStore';

const readMock = getThreadMessagesByResource as jest.Mock;

type Agent = {
  agentId: string;
  createdBy?: string;
  visibility?: string;
};

// Viewer u1; the schedule s1 belongs to agent a1. `agent` is what
// MastraAgent.findOne resolves to (null = agent gone). `schedule` is what
// MastraSchedule.findOne resolves to (null = no such schedule / bad id).
const makeCtx = (
  agent: Agent | null,
  user: { _id?: string } = { _id: 'u1' },
  schedule: { _id: string; agentId: string } | null = {
    _id: 's1',
    agentId: 'a1',
  },
) => ({
  models: {
    MastraAgent: { findOne: jest.fn().mockResolvedValue(agent) },
    MastraSchedule: {
      findOne: jest.fn().mockResolvedValue(schedule),
    },
  },
  user,
  checkPermission: jest.fn().mockResolvedValue(undefined),
  subdomain: 'os',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

beforeEach(() => readMock.mockReset());

describe('mastraScheduleTranscript authorization', () => {
  it('lets an agent-accessor (owner) read, using the SCHEDULE resource not the viewer', async () => {
    readMock.mockResolvedValue([{ _id: 'm1', role: 'assistant', content: 'hi' }]);
    const ctx = makeCtx({ agentId: 'a1', createdBy: 'u1', visibility: 'private' });

    const out = await scheduleQueries.mastraScheduleTranscript(
      undefined,
      { scheduleId: 's1' },
      ctx,
    );

    expect(out).toEqual([{ _id: 'm1', role: 'assistant', content: 'hi' }]);
    // The read used the schedule's own background resource + derived thread id —
    // NOT scopedResource(subdomain, 'u1') (which would be 'os:u1').
    expect(readMock).toHaveBeenCalledTimes(1);
    expect(readMock).toHaveBeenCalledWith('os', 'schedule-s1', 'os:schedule:s1');
    const [, , resourceArg] = readMock.mock.calls[0];
    expect(resourceArg).toBe('os:schedule:s1');
    expect(resourceArg).not.toBe('os:u1');
  });

  it('refuses a non-accessor (private agent owned by someone else) and never reads', async () => {
    const ctx = makeCtx({ agentId: 'a1', createdBy: 'someone-else', visibility: 'private' });

    await expect(
      scheduleQueries.mastraScheduleTranscript(undefined, { scheduleId: 's1' }, ctx),
    ).rejects.toThrow(/not found/i);
    expect(readMock).not.toHaveBeenCalled();
  });

  it('refuses (and never reads) when the owning agent is gone', async () => {
    const ctx = makeCtx(null);

    await expect(
      scheduleQueries.mastraScheduleTranscript(undefined, { scheduleId: 's1' }, ctx),
    ).rejects.toThrow(/not found/i);
    expect(readMock).not.toHaveBeenCalled();
  });

  // Existence-oracle guard: a nonexistent schedule id must be INDISTINGUISHABLE
  // from a valid-id-but-unauthorized read — same message, same shape — so a
  // caller with schedulesView cannot probe which schedule ids exist.
  it('refuses a nonexistent schedule with the SAME error as the unauthorized path', async () => {
    // Unauthorized: schedule exists, private agent owned by someone else.
    const unauthorizedCtx = makeCtx({
      agentId: 'a1',
      createdBy: 'someone-else',
      visibility: 'private',
    });
    // Not found: schedule lookup returns null (bad id).
    const notFoundCtx = makeCtx(
      { agentId: 'a1', createdBy: 'u1', visibility: 'private' },
      { _id: 'u1' },
      null,
    );

    const unauthorizedErr = await scheduleQueries
      .mastraScheduleTranscript(undefined, { scheduleId: 's1' }, unauthorizedCtx)
      .catch((e) => e);
    const notFoundErr = await scheduleQueries
      .mastraScheduleTranscript(undefined, { scheduleId: 'nope' }, notFoundCtx)
      .catch((e) => e);

    // Same message AND same constructor — no way to tell the two apart.
    expect(notFoundErr.message).toBe('Schedule transcript not found');
    expect(notFoundErr.message).toBe(unauthorizedErr.message);
    expect(notFoundErr.constructor).toBe(unauthorizedErr.constructor);
    // Never reached the thread read on either path.
    expect(readMock).not.toHaveBeenCalled();
  });
});
