import {
  INCOMPLETE_PROVIDER_REPLY,
  ProviderCompletionGuard,
  PROVIDER_COMPLETION_MAX_RETRIES,
  resolveGuardedReply,
  sanitizePersistedProviderOutput,
  sanitizeProviderText,
  shouldGuardProviderCompletion,
  shouldGuardProviderOutput,
  shouldRetryProviderStep,
  stalledAfterToolSearch,
} from '../providerOutputGuard';

const SEARCH_RESULT = {
  results: [{ name: 'deals', description: 'deals query', score: 7.8 }],
  message: 'Found and loaded 1 tool(s): deals.',
};

describe('providerOutputGuard', () => {
  it('allows one corrective provider retry', () => {
    expect(PROVIDER_COMPLETION_MAX_RETRIES).toBe(1);
  });

  it('buffers Kimi K3 models served through custom provider ids', () => {
    expect(shouldGuardProviderOutput('moonshotai/Kimi-K3')).toBe(true);
    expect(shouldGuardProviderOutput('kimi-k3')).toBe(true);
    expect(shouldGuardProviderOutput('moonshotai/Kimi-K2.5')).toBe(false);
  });

  it('guards Kimi coding tool turns without buffering their reasoning', () => {
    expect(shouldGuardProviderCompletion('kimi-for-coding-highspeed')).toBe(
      true,
    );
    expect(shouldGuardProviderCompletion('gpt-4o')).toBe(false);
  });

  it('removes a leaked reasoning prefix and control tokens', () => {
    expect(
      sanitizeProviderText(
        'private chain of thought<|close|>think<|sep|>Final answer.',
      ),
    ).toEqual({ text: 'Final answer.', leakedReasoning: true });
  });

  it('detects a stall structurally from tool-call order, in any language', () => {
    expect(
      stalledAfterToolSearch([
        { toolName: 'deals', result: { list: [], totalCount: 0 } },
        { toolName: 'search_tools', result: SEARCH_RESULT },
      ]),
    ).toBe(true);
    expect(
      stalledAfterToolSearch([
        { toolName: 'search_tools', result: SEARCH_RESULT },
        { toolName: 'deals', result: { list: [], totalCount: 0 } },
      ]),
    ).toBe(false);
  });

  it('does not treat an empty search or real work as a stall', () => {
    expect(
      stalledAfterToolSearch([
        {
          toolName: 'search_tools',
          result: { results: [], message: 'No tools found.' },
        },
      ]),
    ).toBe(false);
    expect(
      stalledAfterToolSearch([
        { toolName: 'deals', result: { list: [], totalCount: 0 } },
      ]),
    ).toBe(false);
    expect(stalledAfterToolSearch([])).toBe(false);
  });

  it('keeps a completed answer after a leaked reasoning separator', () => {
    expect(
      resolveGuardedReply({
        latestText: 'hidden reasoning<|close|>think<|sep|>The report is ready.',
        allText: 'hidden reasoning<|close|>think<|sep|>The report is ready.',
        stalled: false,
      }),
    ).toEqual({
      text: 'The report is ready.',
      incomplete: false,
      leakedReasoning: true,
    });
  });

  it('leaves a stalled reply empty so tool results can become the answer', () => {
    expect(
      resolveGuardedReply({
        latestText: 'Good data. Fetching two detailed sources now.',
        allText:
          'private chain<|close|>think<|sep|>Good data. Fetching two detailed sources now.',
        stalled: true,
      }),
    ).toEqual({
      text: null,
      incomplete: true,
      leakedReasoning: true,
    });
  });

  it('retries a text-only step that stalls right after a tool search', () => {
    expect(
      shouldRetryProviderStep({
        toolCallCount: 0,
        toolActivity: [{ toolName: 'search_tools', result: SEARCH_RESULT }],
      }),
    ).toBe(true);
  });

  it('does not retry completed work or steps that invoke a tool', () => {
    expect(
      shouldRetryProviderStep({
        toolCallCount: 0,
        toolActivity: [
          { toolName: 'search_tools', result: SEARCH_RESULT },
          { toolName: 'deals', result: { list: [], totalCount: 0 } },
        ],
      }),
    ).toBe(false);
    expect(
      shouldRetryProviderStep({
        toolCallCount: 1,
        toolActivity: [{ toolName: 'search_tools', result: SEARCH_RESULT }],
      }),
    ).toBe(false);
  });

  it('forces a tool call on the corrective retry', () => {
    const guard = new ProviderCompletionGuard();
    const messages: unknown[] = [];
    const args = (retryCount: number) =>
      ({
        retryCount,
        messages,
        activeTools: ['search_tools'],
        state: {},
      } as unknown as Parameters<
        ProviderCompletionGuard['processInputStep']
      >[0]);

    expect(guard.processInputStep(args(0))).toBeUndefined();
    expect(guard.processInputStep(args(1))).toEqual({
      messages,
      toolChoice: 'required',
    });
  });

  it('aborts a step that stops right after a tool search', () => {
    const guard = new ProviderCompletionGuard();
    const state: Record<string, unknown> = {};
    const messages: unknown[] = [];
    guard.processInputStep({
      retryCount: 0,
      messages,
      activeTools: ['search_tools'],
      state,
    } as never);
    const abort = jest.fn();

    guard.processOutputStep({
      text: 'Let me check the deals next.',
      toolCalls: [],
      steps: [
        {
          toolResults: [{ toolName: 'search_tools', result: SEARCH_RESULT }],
        },
      ],
      retryCount: 0,
      state,
      messages,
      abort,
    } as never);

    expect(abort).toHaveBeenCalledWith(expect.any(String), {
      retry: true,
      metadata: { finishReason: undefined },
    });
  });

  it('does not retry when the turn has no active tools', () => {
    const guard = new ProviderCompletionGuard();
    const state: Record<string, unknown> = {};
    const messages: unknown[] = [];
    guard.processInputStep({
      retryCount: 0,
      messages,
      activeTools: [],
      state,
    } as never);
    const abort = jest.fn();

    const result = guard.processOutputStep({
      text: 'Let me check the deals next.',
      toolCalls: [],
      steps: [
        {
          toolResults: [{ toolName: 'search_tools', result: SEARCH_RESULT }],
        },
      ],
      retryCount: 0,
      state,
      messages,
      abort,
    } as never);

    expect(result).toBe(messages);
    expect(abort).not.toHaveBeenCalled();
  });

  it('sanitizes a previously persisted leaked turn without raw text parts', () => {
    const reasoning = { type: 'reasoning', reasoning: 'structured thought' };
    const tool = {
      type: 'tool-invocation',
      toolInvocation: { toolName: 'webSearch' },
    };
    const result = sanitizePersistedProviderOutput('The answer.', [
      { type: 'text', text: 'hidden<|close|>think<|sep|>The ' },
      reasoning,
      tool,
      { type: 'text', text: 'answer.' },
    ]);

    expect(result.content).toBe('The answer.');
    expect(result.parts).toEqual([
      reasoning,
      tool,
      { type: 'text', text: 'The answer.' },
    ]);
  });

  it('falls back when a persisted leaked turn has no visible text', () => {
    const result = sanitizePersistedProviderOutput('', [
      { type: 'text', text: 'hidden<|close|>think<|sep|>' },
    ]);

    expect(result.content).toBe(INCOMPLETE_PROVIDER_REPLY);
    expect(result.parts).toEqual([
      { type: 'text', text: INCOMPLETE_PROVIDER_REPLY },
    ]);
  });

  it('leaves normal persisted messages untouched', () => {
    const parts = [{ type: 'text', text: 'Normal answer.' }];
    const result = sanitizePersistedProviderOutput('Normal answer.', parts);

    expect(result).toEqual({ content: 'Normal answer.', parts });
    expect(result.parts).toBe(parts);
  });
});
