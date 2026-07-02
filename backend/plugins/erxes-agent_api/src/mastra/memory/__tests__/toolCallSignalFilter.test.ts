import { ToolCallSignalFilter } from '../toolCallSignalFilter';

type Part =
  | { type: 'text'; text: string }
  | {
      type: 'tool-invocation';
      toolInvocation: {
        toolName: string;
        toolCallId: string;
        state: string;
        result?: unknown;
      };
    };

function assistant(parts: Part[], extra: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    role: 'assistant' as const,
    createdAt: new Date(0),
    content: { format: 2 as const, parts, ...extra },
  };
}

function run(messages: unknown[]) {
  const filter = new ToolCallSignalFilter();
  return filter.processInput({
    messageList: { get: { all: { db: () => messages as never } } },
  } as never);
}

describe('ToolCallSignalFilter', () => {
  // A turn-1 render call recalled on turn 2 must NOT vanish: the raw frame is
  // dropped but a text breadcrumb survives, so the model still sees it may call
  // the render tool again (the second-artifact silent-failure bug).
  it('replaces a recalled render tool-call with a text breadcrumb', async () => {
    const out = await run([
      assistant([
        {
          type: 'tool-invocation',
          toolInvocation: {
            toolName: 'render-chart',
            toolCallId: 'c1',
            state: 'result',
            result: { artifact: { id: 'chart_1' } },
          },
        },
      ]),
    ]);

    const parts = out[0].content.parts;
    expect(parts.some((p) => p.type === 'tool-invocation')).toBe(false);
    expect(parts).toEqual([
      { type: 'text', text: 'Used the `render-chart` tool.' },
    ]);
  });

  // A message that was ONLY a tool call must not be deleted (stock ToolCallFilter
  // dropped it, erasing the signal). It survives as the breadcrumb.
  it('keeps a tool-only assistant message alive', async () => {
    const out = await run([
      assistant([
        {
          type: 'tool-invocation',
          toolInvocation: {
            toolName: 'render-diagram',
            toolCallId: 'c2',
            state: 'result',
          },
        },
      ]),
    ]);

    expect(out).toHaveLength(1);
    expect(out[0].content.parts).toEqual([
      { type: 'text', text: 'Used the `render-diagram` tool.' },
    ]);
  });

  // No raw tool frames may reach a reasoning model: legacy top-level
  // toolInvocations are stripped alongside the parts.
  it('drops legacy top-level toolInvocations', async () => {
    const out = await run([
      assistant(
        [
          { type: 'text', text: "Here's your chart." },
          {
            type: 'tool-invocation',
            toolInvocation: {
              toolName: 'render-chart',
              toolCallId: 'c3',
              state: 'result',
            },
          },
        ],
        { toolInvocations: [{ toolCallId: 'c3', toolName: 'render-chart' }] },
      ),
    ]);

    expect(out[0].content.toolInvocations).toBeUndefined();
    expect(out[0].content.parts).toEqual([
      { type: 'text', text: "Here's your chart." },
      { type: 'text', text: 'Used the `render-chart` tool.' },
    ]);
  });

  it('leaves tool-free messages untouched', async () => {
    const user = {
      id: 'u1',
      role: 'user' as const,
      createdAt: new Date(0),
      content: { format: 2 as const, parts: [{ type: 'text', text: 'hi' }] },
    };
    const out = await run([user]);
    expect(out[0]).toBe(user);
  });

  it('collapses duplicate frames for the same tool into one breadcrumb', async () => {
    const out = await run([
      assistant([
        {
          type: 'tool-invocation',
          toolInvocation: { toolName: 'render-chart', toolCallId: 'c4', state: 'call' },
        },
        {
          type: 'tool-invocation',
          toolInvocation: { toolName: 'render-chart', toolCallId: 'c4', state: 'result' },
        },
      ]),
    ]);

    expect(out[0].content.parts).toEqual([
      { type: 'text', text: 'Used the `render-chart` tool.' },
    ]);
  });
});
