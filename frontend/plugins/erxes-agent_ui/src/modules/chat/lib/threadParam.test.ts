import { withThreadParam } from './threadParam';

// Conversation addressability: the active thread lives in ?thread=<id>. Selecting
// a session sets it (deep-linkable, reload-restorable); New chat / delete clears
// it so an agent-only URL keeps its old "open most-recent / draft" behavior.
describe('withThreadParam', () => {
  it('sets ?thread= when a thread is selected', () => {
    const next = withThreadParam(new URLSearchParams(''), 'thread-abc');
    expect(next.get('thread')).toBe('thread-abc');
  });

  it('replaces an existing ?thread= when switching conversations', () => {
    const next = withThreadParam(new URLSearchParams('thread=old'), 'thread-new');
    expect(next.get('thread')).toBe('thread-new');
    expect(next.getAll('thread')).toHaveLength(1);
  });

  it('clears ?thread= for a new draft (falls back to agent default)', () => {
    const next = withThreadParam(new URLSearchParams('thread=old'), undefined);
    expect(next.has('thread')).toBe(false);
  });

  it('preserves unrelated query params', () => {
    const next = withThreadParam(new URLSearchParams('foo=bar'), 'thread-1');
    expect(next.get('foo')).toBe('bar');
    expect(next.get('thread')).toBe('thread-1');
  });

  it('does not mutate the input params', () => {
    const prev = new URLSearchParams('thread=keep');
    withThreadParam(prev, 'changed');
    expect(prev.get('thread')).toBe('keep');
  });
});
