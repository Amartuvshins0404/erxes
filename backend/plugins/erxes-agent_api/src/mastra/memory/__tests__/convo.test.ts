import { augmentConvo, deriveResourceId } from '../convo';

describe('convo assembly', () => {
  const history = [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ];

  it('AM-CONV-1: order is [wm?, digest?, ...history, user] with user last', () => {
    const convo = augmentConvo({
      recentHistory: history,
      userMessage: 'now',
      learnedDigestBlock: 'DIGEST',
      workingMemoryBlock: 'WM',
    });
    expect(convo.map((m) => m.content)).toEqual([
      'WM',
      'DIGEST',
      'hi',
      'hello',
      'now',
    ]);
    expect(convo[convo.length - 1]).toEqual({ role: 'user', content: 'now' });
  });

  it('AM-CONV-2: injected blocks are system role, never tool frames', () => {
    const convo = augmentConvo({
      recentHistory: [],
      userMessage: 'x',
      learnedDigestBlock: 'DIGEST',
      workingMemoryBlock: 'WM',
    });
    const injected = convo.filter(
      (m) => m.content === 'WM' || m.content === 'DIGEST',
    );
    expect(injected.every((m) => m.role === 'system')).toBe(true);
    // no tool-call frames anywhere
    expect(
      convo.some(
        (m: { role: string; tool_calls?: unknown }) =>
          m.role === 'tool' || m.tool_calls,
      ),
    ).toBe(false);
  });

  it('AM-CONV-3: both blocks absent → byte-identical to plain replay', () => {
    const convo = augmentConvo({ recentHistory: history, userMessage: 'now' });
    expect(convo).toEqual([...history, { role: 'user', content: 'now' }]);
  });

  it('AM-CONV-5: deriveResourceId uses user id, else per-agent fallback', () => {
    expect(deriveResourceId({ user: { _id: 'u1' }, agentId: 'a' })).toBe('u1');
    expect(deriveResourceId({ user: null, agentId: 'a' })).toBe('agent:a');
    expect(deriveResourceId({ agentId: 'a' })).toBe('agent:a');
  });
});
