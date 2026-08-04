import { ToolCallSignalFilter } from '../toolCallSignalFilter';

type PromptMessage =
  | { role: 'system'; content: string }
  | {
      role: 'user';
      content: { type: 'text'; text: string }[];
    }
  | {
      role: 'assistant';
      content: (
        | { type: 'text'; text: string }
        | { type: 'reasoning'; text: string }
        | {
            type: 'tool-call';
            toolName: string;
            toolCallId: string;
            input: unknown;
          }
      )[];
    }
  | {
      role: 'tool';
      content: {
        type: 'tool-result';
        toolName: string;
        toolCallId: string;
        output: { type: 'json'; value: unknown };
      }[];
    };

const historicalCall = {
  type: 'tool-call' as const,
  toolName: 'terminal',
  toolCallId: 'old-call',
  input: { command: 'python3 report.py' },
};

const historicalResult = {
  type: 'tool-result' as const,
  toolName: 'terminal',
  toolCallId: 'old-call',
  output: { type: 'json' as const, value: { exitCode: 0 } },
};

function run(prompt: PromptMessage[], steps: unknown[] = []) {
  const filter = new ToolCallSignalFilter();
  return filter.processLLMRequest({ prompt, steps } as never);
}

describe('ToolCallSignalFilter', () => {
  it('rewrites historical tool frames only in the outbound provider prompt', () => {
    const prompt: PromptMessage[] = [
      { role: 'system', content: 'Be helpful.' },
      { role: 'assistant', content: [historicalCall] },
      { role: 'tool', content: [historicalResult] },
      {
        role: 'user',
        content: [{ type: 'text', text: 'Create another report.' }],
      },
    ];

    const result = run(prompt);

    expect(result).toEqual({
      prompt: [
        {
          role: 'system',
          content:
            'Be helpful.\n\nConversation history note: earlier turns invoked these tools: terminal. These tools remain available; call them again when needed instead of only describing the action.',
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'Create another report.' }],
        },
      ],
    });
    expect(prompt[1]).toEqual({
      role: 'assistant',
      content: [historicalCall],
    });
    expect(prompt[2]).toEqual({ role: 'tool', content: [historicalResult] });
  });

  it('preserves tool frames created by the current agentic loop', () => {
    const prompt: PromptMessage[] = [
      { role: 'assistant', content: [historicalCall] },
      { role: 'tool', content: [historicalResult] },
    ];
    const steps = [
      {
        toolCalls: [{ toolCallId: 'old-call' }],
      },
    ];

    expect(run(prompt, steps)).toBeUndefined();
  });

  it('keeps assistant prose while removing its recalled tool call', () => {
    const prompt: PromptMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'The report is ready.' },
          historicalCall,
        ],
      },
    ];

    expect(run(prompt)).toEqual({
      prompt: [
        {
          role: 'system',
          content:
            'Conversation history note: earlier turns invoked these tools: terminal. These tools remain available; call them again when needed instead of only describing the action.',
        },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'The report is ready.' }],
        },
      ],
    });
  });

  it('removes historical reasoning while keeping final assistant prose', () => {
    const prompt: PromptMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'reasoning', text: 'I should repeat the old workflow.' },
          { type: 'text', text: 'The prior website was published.' },
        ],
      },
      {
        role: 'user',
        content: [{ type: 'text', text: 'Build a different website.' }],
      },
    ];

    expect(run(prompt)).toEqual({
      prompt: [
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'The prior website was published.' }],
        },
        {
          role: 'user',
          content: [{ type: 'text', text: 'Build a different website.' }],
        },
      ],
    });
  });

  it('leaves tool-free prompts untouched', () => {
    const prompt: PromptMessage[] = [
      { role: 'system', content: 'Be helpful.' },
      {
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      },
    ];

    expect(run(prompt)).toBeUndefined();
  });
});
