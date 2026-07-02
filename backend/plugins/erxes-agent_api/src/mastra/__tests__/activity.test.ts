import {
  buildActivityContext,
  sanitizeActivity,
  createActivityTracker,
  parseCombined,
} from '../activity';

describe('parseCombined', () => {
  it('extracts the turn headline and each indexed step summary', () => {
    const raw = [
      'TURN: Synthesized marketplace data into a PDF report',
      "[0] The request is ambiguous, so I'll ask which report they mean.",
      '[2] Found four YC batches for 2026, so I cover all four cohorts.',
    ].join('\n');
    const { turn, steps } = parseCombined(raw, true);
    expect(turn).toBe('Synthesized marketplace data into a PDF report');
    expect(steps).toEqual([
      { index: 0, summary: "The request is ambiguous, so I'll ask which report they mean." },
      { index: 2, summary: 'Found four YC batches for 2026, so I cover all four cohorts.' },
    ]);
  });

  it('joins a step summary that wrapped across lines', () => {
    const raw = ['[1] First part of the thought', 'and its continuation.'].join(
      '\n',
    );
    const { steps } = parseCombined(raw, false);
    expect(steps).toEqual([
      { index: 1, summary: 'First part of the thought and its continuation.' },
    ]);
  });

  it('drops the turn when not wanted and ignores stray prose', () => {
    const raw = ['Here are the summaries:', '[3] A concrete step summary.'].join(
      '\n',
    );
    const { turn, steps } = parseCombined(raw, false);
    expect(turn).toBeNull();
    expect(steps).toEqual([{ index: 3, summary: 'A concrete step summary.' }]);
  });

  it('returns empty results for unusable output', () => {
    expect(parseCombined('', true)).toEqual({ turn: null, steps: [] });
    expect(parseCombined('no markers here', true)).toEqual({
      turn: null,
      steps: [],
    });
  });
});

describe('buildActivityContext', () => {
  it('returns null when nothing is in flight', () => {
    expect(buildActivityContext({})).toBeNull();
    expect(buildActivityContext({ userMessage: 'hi' })).toBeNull();
  });

  it('includes the user request and the reasoning tail', () => {
    const ctx = buildActivityContext({
      userMessage: 'Find my open tickets',
      thinking: 'The user wants open tickets, I should query frontline',
    });
    expect(ctx).toContain('User request: Find my open tickets');
    expect(ctx).toContain('Agent reasoning (live tail):');
  });

  it('clips a long reasoning burst to its tail', () => {
    const ctx = buildActivityContext({
      thinking: `start ${'x'.repeat(2000)} end`,
    });
    expect(ctx).not.toContain('start');
    expect(ctx).toContain('…');
    expect(ctx).toContain('end');
  });

  it('describes the invoked tool with clipped args', () => {
    const ctx = buildActivityContext({
      toolName: 'searchCustomers',
      toolArgs: { name: 'John' },
    });
    expect(ctx).toContain('Invoking tool: searchCustomers');
    expect(ctx).toContain('"name":"John"');
  });
});

describe('sanitizeActivity', () => {
  it('keeps a clean line as-is', () => {
    expect(sanitizeActivity('Searching customers named John')).toBe(
      'Searching customers named John',
    );
  });

  it('strips quotes, prefixes, and trailing punctuation', () => {
    expect(sanitizeActivity('Status: "Looking up order #1042."')).toBe(
      'Looking up order #1042',
    );
  });

  it('keeps only the first line and collapses whitespace', () => {
    expect(sanitizeActivity('Comparing   plans\nand more text')).toBe(
      'Comparing plans',
    );
  });

  it('returns null for empty output', () => {
    expect(sanitizeActivity('')).toBeNull();
    expect(sanitizeActivity('   \n')).toBeNull();
    expect(sanitizeActivity(null)).toBeNull();
  });

  it('truncates overlong lines', () => {
    const out = sanitizeActivity('word '.repeat(60)) ?? '';
    expect(out.length).toBeLessThanOrEqual(81);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('createActivityTracker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const flush = async () => {
    // run pending timers and let the summarize promise chain settle
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();
  };

  it('summarizes on a tool call and emits the result', async () => {
    const summarize = jest.fn().mockResolvedValue('Searching customers');
    const emit = jest.fn();
    const tracker = createActivityTracker({ summarize, emit });

    tracker.onToolCall('searchCustomers', { name: 'John' });
    await flush();

    expect(summarize).toHaveBeenCalledWith(
      expect.objectContaining({ toolName: 'searchCustomers' }),
    );
    expect(emit).toHaveBeenCalledWith('Searching customers');
    tracker.stop();
  });

  it('waits for enough new reasoning before summarizing', async () => {
    const summarize = jest.fn().mockResolvedValue('Thinking about tickets');
    const emit = jest.fn();
    const tracker = createActivityTracker({
      summarize,
      emit,
      minNewThinkingChars: 50,
    });

    tracker.onThinking('short');
    await flush();
    expect(summarize).not.toHaveBeenCalled();

    tracker.onThinking('x'.repeat(60));
    await flush();
    expect(summarize).toHaveBeenCalledTimes(1);
    tracker.stop();
  });

  it('does not re-emit an unchanged line', async () => {
    const summarize = jest.fn().mockResolvedValue('Same status');
    const emit = jest.fn();
    const tracker = createActivityTracker({
      summarize,
      emit,
      minIntervalMs: 0,
      minNewThinkingChars: 1,
    });

    tracker.onThinking('aaaa');
    await flush();
    tracker.onThinking('bbbb');
    await flush();

    expect(emit).toHaveBeenCalledTimes(1);
    tracker.stop();
  });

  it('never emits after stop', async () => {
    let resolve!: (v: string) => void;
    const summarize = jest.fn(() => new Promise<string>((r) => (resolve = r)));
    const emit = jest.fn();
    const tracker = createActivityTracker({ summarize, emit });

    tracker.onToolCall('slowTool');
    await flush();
    tracker.stop();
    resolve('Too late');
    await Promise.resolve();
    await Promise.resolve();

    expect(emit).not.toHaveBeenCalled();
  });
});
