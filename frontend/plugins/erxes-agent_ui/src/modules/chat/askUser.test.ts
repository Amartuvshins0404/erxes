import {
  asAskUserQuestion,
  formatAskUserAnswer,
  formatAskUserSkip,
  isAwaitingUserAnswer,
  parseAskUserAnswer,
} from './types';

describe('asAskUserQuestion', () => {
  it('narrows the tool args to a question payload', () => {
    const q = asAskUserQuestion({
      question: 'Which batch?',
      options: [
        { label: 'Latest', description: 'Summer 2026' },
        { label: 'Winter 2026' },
        { label: 42 },
        'nope',
      ],
    });
    expect(q?.question).toBe('Which batch?');
    expect(q?.options).toEqual([
      { label: 'Latest', description: 'Summer 2026' },
      { label: 'Winter 2026' },
    ]);
    expect(q?.selectionMode).toBe('single_select');
  });

  it('passes multi_select through and leaves free-text mode undefined', () => {
    expect(
      asAskUserQuestion({
        question: 'Pick many',
        options: [{ label: 'A' }],
        selectionMode: 'multi_select',
      })?.selectionMode,
    ).toBe('multi_select');
    expect(asAskUserQuestion({ question: 'Why?' })?.selectionMode).toBe(
      undefined,
    );
  });

  it('rejects missing/empty questions', () => {
    expect(asAskUserQuestion({})).toBeNull();
    expect(asAskUserQuestion({ question: '  ' })).toBeNull();
    expect(asAskUserQuestion(null)).toBeNull();
  });
});

describe('isAwaitingUserAnswer', () => {
  it('detects the pending envelope', () => {
    expect(isAwaitingUserAnswer({ awaitingUserAnswer: true })).toBe(true);
    expect(isAwaitingUserAnswer({ awaitingUserAnswer: false })).toBe(false);
    expect(isAwaitingUserAnswer(undefined)).toBe(false);
  });
});

describe('ask_user answer message convention', () => {
  it('round-trips an answer through format + parse', () => {
    const text = formatAskUserAnswer('Which batch?', 'Latest batch (S26)');
    expect(text).toBe(
      'Regarding your question "Which batch?": Latest batch (S26)',
    );
    expect(parseAskUserAnswer(text)).toBe('Latest batch (S26)');
  });

  it('round-trips a skip', () => {
    const text = formatAskUserSkip('Which batch?');
    const parsed = parseAskUserAnswer(text);
    expect(parsed?.startsWith('(skipped')).toBe(true);
  });

  it('rejects unrelated messages', () => {
    expect(parseAskUserAnswer('Just a normal reply')).toBeNull();
    expect(parseAskUserAnswer('Regarding your question')).toBeNull();
  });
});
