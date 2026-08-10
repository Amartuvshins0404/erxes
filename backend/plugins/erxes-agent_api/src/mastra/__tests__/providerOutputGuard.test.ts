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
} from '../providerOutputGuard';

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

  it('keeps a completed answer after a leaked reasoning separator', () => {
    expect(
      resolveGuardedReply({
        latestText: 'hidden reasoning<|close|>think<|sep|>The report is ready.',
        allText: 'hidden reasoning<|close|>think<|sep|>The report is ready.',
      }),
    ).toEqual({
      text: 'The report is ready.',
      incomplete: false,
      leakedReasoning: true,
    });
  });

  it('leaves unfinished narration empty so tool results can become the answer', () => {
    expect(
      resolveGuardedReply({
        latestText:
          'Good data. Fetching two detailed sources for the landing page.',
        allText:
          'private chain<|close|>think<|sep|>Good data. Fetching two detailed sources for the landing page.',
      }),
    ).toEqual({
      text: null,
      incomplete: true,
      leakedReasoning: true,
    });
  });

  it('retries stalled continuations before ending the turn', () => {
    for (const text of [
      'Let me update my notes and build the landing page now.',
      'I’ll pull up the teams on your system now.',
    ]) {
      expect(
        shouldRetryProviderStep({
          text,
          toolCallCount: 0,
          finishReason: 'stop',
        }),
      ).toBe(true);
    }
  });

  it('retries the reported build promise instead of settling it', () => {
    expect(
      shouldRetryProviderStep({
        text: 'I have all the research. Building the site now — single HTML file with GSAP animations and interactive charts.',
        toolCallCount: 0,
        finishReason: 'stop',
      }),
    ).toBe(true);
  });

  it('retries long multi-sentence narration that still promises the build', () => {
    expect(
      shouldRetryProviderStep({
        text:
          "Research is already complete and in memory, so I'm building the site right away — a dark, YC-orange landing page with GSAP animations and Chart.js charts, published straight to Preview. " +
          "I have all the research I need from earlier. Now I'll build the landing website — a single self-contained HTML file with GSAP animations, Chart.js charts, dark theme with YC orange. Let me check what's in the workspace first, then build.",
        toolCallCount: 0,
        finishReason: 'stop',
      }),
    ).toBe(true);
  });

  it('does not retry completed answers or steps that invoke a tool', () => {
    expect(
      shouldRetryProviderStep({
        text: 'The landing page is ready in Preview.',
        toolCallCount: 0,
        finishReason: 'stop',
      }),
    ).toBe(false);
    expect(
      shouldRetryProviderStep({
        text: '',
        toolCallCount: 1,
        finishReason: 'tool-calls',
      }),
    ).toBe(false);
  });

  it('keeps ordinary future-tense answers', () => {
    for (const text of [
      'I’ll build a report if you ask for one.',
      'I’ll build another report if requested. The current total is 12.',
    ]) {
      expect(
        shouldRetryProviderStep({
          text,
          toolCallCount: 0,
          finishReason: 'stop',
        }),
      ).toBe(false);
    }
  });

  it('only forces a tool call when the provider requires it', () => {
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
    expect(
      new ProviderCompletionGuard(false).processInputStep(args(1)),
    ).toBeUndefined();
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
      text: 'I’ll pull up the teams on your system now.',
      toolCalls: [],
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
    const result = sanitizePersistedProviderOutput(
      'Good data. Fetching another source.',
      [
        { type: 'text', text: 'hidden<|close|>think<|sep|>progress' },
        reasoning,
        tool,
        { type: 'text', text: 'more progress' },
      ],
    );

    expect(result.content).toBe(INCOMPLETE_PROVIDER_REPLY);
    expect(result.parts).toEqual([
      reasoning,
      tool,
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
