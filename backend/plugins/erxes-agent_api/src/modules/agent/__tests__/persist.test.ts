// persist.ts only needs the native-store facade; stub it so the recovery logic
// under test runs without Mastra/Mongo.
jest.mock('@/session/nativeStore', () => ({
  getThreadTitle: jest.fn(),
  getNativeMemory: jest.fn(),
  ensureThreadRegistered: jest.fn(),
  patchNativeMessages: jest.fn(),
}));

import { patchNativeTurn } from '@/agent/persist';
import {
  getNativeMemory,
  patchNativeMessages,
} from '@/session/nativeStore';

const recall = jest.fn();

const NOW = Date.now();
// Started 2s ago — comfortably inside the 5s skew for rows written this turn.
const TURN_STARTED_AT = new Date(NOW - 2_000);
const prevAssistant = {
  id: 'prev-assistant',
  role: 'assistant',
  createdAt: new Date(NOW - 60_000),
};
const freshAssistant = {
  id: 'fresh-assistant',
  role: 'assistant',
  createdAt: new Date(NOW),
};
const freshUser = { id: 'fresh-user', role: 'user', createdAt: new Date(NOW) };

const runTurn = (over: Record<string, unknown> = {}) =>
  patchNativeTurn({
    subdomain: 'test',
    binding: { thread: 'thread-1', resource: 'res-1' },
    agentId: 'agent-1',
    reply: 'Here is your chart.',
    // Makes wantAssistant true, so the recovery path actually runs.
    turnSummary: 'Rendered a chart',
    turnStartedAt: TURN_STARTED_AT,
    ...over,
  });

beforeEach(() => {
  jest.clearAllMocks();
  (getNativeMemory as jest.Mock).mockResolvedValue({ recall });
});

describe('patchNativeTurn assistant-id recovery', () => {
  it('recovers the assistant row written during this turn', async () => {
    recall.mockResolvedValue({ messages: [freshAssistant, freshUser, prevAssistant] });

    const id = await runTurn();

    expect(id).toBe('fresh-assistant');
    expect(recall).toHaveBeenCalledTimes(1);
    expect(patchNativeMessages).toHaveBeenCalledWith(
      'test',
      expect.arrayContaining([
        expect.objectContaining({ id: 'fresh-assistant' }),
      ]),
    );
  });

  // The bug this guards: with the new row still mid-write, the recall's most
  // recent assistant row is the PREVIOUS turn's. Returning that id linked the
  // turn's artifacts to the wrong message — the chart then rendered under no
  // bubble at all. Better to return null (unlinked artifacts still re-attach
  // via the client's prompt matcher) than a wrong id.
  it('never returns a previous turn\'s assistant row', async () => {
    recall.mockResolvedValue({ messages: [prevAssistant, freshUser] });

    const id = await runTurn();

    expect(id).toBeNull();
    // Retried once for a row that was merely mid-write.
    expect(recall).toHaveBeenCalledTimes(2);
    // And never patched the stale row with this turn's meta.
    expect(patchNativeMessages).not.toHaveBeenCalled();
  });

  it('recovers via the retry when the row lands late', async () => {
    recall
      .mockResolvedValueOnce({ messages: [prevAssistant, freshUser] })
      .mockResolvedValueOnce({
        messages: [freshAssistant, freshUser, prevAssistant],
      });

    const id = await runTurn();

    expect(id).toBe('fresh-assistant');
    expect(recall).toHaveBeenCalledTimes(2);
  });

  it('trusts an explicit assistantMessageId without recovery', async () => {
    recall.mockResolvedValue({ messages: [prevAssistant, freshAssistant] });

    const id = await runTurn({ assistantMessageId: 'prev-assistant' });

    expect(id).toBe('prev-assistant');
    expect(patchNativeMessages).toHaveBeenCalledWith(
      'test',
      expect.arrayContaining([
        expect.objectContaining({ id: 'prev-assistant' }),
      ]),
    );
  });

  it('treats a row with no timestamp as unverifiable (stale)', async () => {
    recall.mockResolvedValue({
      messages: [{ id: 'undated-assistant', role: 'assistant' }],
    });

    const id = await runTurn();

    expect(id).toBeNull();
  });

  it('accepts any assistant row when no turn start is known (legacy turns)', async () => {
    recall.mockResolvedValue({ messages: [prevAssistant] });

    const id = await runTurn({ turnStartedAt: undefined });

    expect(id).toBe('prev-assistant');
  });
});
