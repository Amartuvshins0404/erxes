jest.mock('@mastra/core/tools', () => ({
  createTool: (config: unknown) => config,
}));

import { askUserTool, isAwaitingUserAnswer } from '../metaTools';

interface AskUserToolLike {
  id: string;
  execute: (input: {
    question: string;
    options?: { label: string; description?: string }[];
    selectionMode?: 'single_select' | 'multi_select';
  }) => Promise<{
    awaitingUserAnswer: boolean;
    question: string;
    options: unknown[];
    selectionMode?: string;
  }>;
}

const tool = askUserTool as unknown as AskUserToolLike;

describe('askUserTool', () => {
  it('keeps the built-in contract id', () => {
    expect(tool.id).toBe('ask_user');
  });

  it('echoes the question payload as an awaiting result (never suspends)', async () => {
    const result = await tool.execute({
      question: 'Which YC batch should I research?',
      options: [
        { label: 'Latest batch (Summer 2026)' },
        { label: 'Winter 2026', description: 'The previous batch' },
      ],
      selectionMode: 'single_select',
    });
    expect(result.awaitingUserAnswer).toBe(true);
    expect(result.question).toBe('Which YC batch should I research?');
    expect(result.options).toHaveLength(2);
    expect(result.selectionMode).toBe('single_select');
  });

  it('defaults selection mode for options and omits it for free-text', async () => {
    const withOptions = await tool.execute({
      question: 'Pick one',
      options: [{ label: 'A' }],
    });
    expect(withOptions.selectionMode).toBe('single_select');

    const freeText = await tool.execute({ question: 'What do you mean?' });
    expect(freeText.selectionMode).toBeUndefined();
    expect(freeText.options).toEqual([]);
  });
});

describe('isAwaitingUserAnswer', () => {
  it('narrows the awaiting envelope', () => {
    expect(isAwaitingUserAnswer({ awaitingUserAnswer: true })).toBe(true);
    expect(isAwaitingUserAnswer({ awaitingUserAnswer: false })).toBe(false);
    expect(isAwaitingUserAnswer({ success: true })).toBe(false);
    expect(isAwaitingUserAnswer(null)).toBe(false);
    expect(isAwaitingUserAnswer('asked')).toBe(false);
  });
});
