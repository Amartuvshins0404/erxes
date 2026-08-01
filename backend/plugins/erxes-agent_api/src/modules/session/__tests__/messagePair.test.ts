import { findMessagePairIds } from '@/session/messagePair';

const messages = [
  { _id: 'user-1', role: 'user' },
  { _id: 'assistant-1', role: 'assistant' },
  { _id: 'user-2', role: 'user' },
  { _id: 'assistant-2', role: 'assistant' },
];

describe('findMessagePairIds', () => {
  it('selects a user prompt and its following assistant reply', () => {
    expect(findMessagePairIds(messages, 'user-1')).toEqual([
      'user-1',
      'assistant-1',
    ]);
  });

  it('accepts the reconciled assistant id for a just-finished turn', () => {
    expect(findMessagePairIds(messages, 'assistant-2')).toEqual([
      'user-2',
      'assistant-2',
    ]);
  });

  it('deletes an unanswered user prompt by itself', () => {
    expect(
      findMessagePairIds(
        [...messages, { _id: 'user-3', role: 'user' }],
        'user-3',
      ),
    ).toEqual(['user-3']);
  });

  it('rejects an assistant message without a preceding user prompt', () => {
    expect(
      findMessagePairIds(
        [{ _id: 'assistant-only', role: 'assistant' }],
        'assistant-only',
      ),
    ).toBeNull();
  });
});
