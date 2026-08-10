import {
  readChatMode,
  readWorkflowParam,
  withChatMode,
  withWorkflowParam,
} from './chatMode';

describe('workflow chat mode URL state', () => {
  it('defaults unknown or absent mode values to chat', () => {
    expect(readChatMode(new URLSearchParams())).toBe('chat');
    expect(readChatMode(new URLSearchParams('mode=scheduled'))).toBe('chat');
  });

  it('deep-links workflow mode and its selected workflow', () => {
    const modeParams = withChatMode(
      new URLSearchParams('thread=thread-1'),
      'workflow',
    );
    const params = withWorkflowParam(modeParams, 'workflow-1');

    expect(readChatMode(params)).toBe('workflow');
    expect(readWorkflowParam(params)).toBe('workflow-1');
    expect(params.get('thread')).toBe('thread-1');
  });

  it('clears workflow-only state when returning to chat', () => {
    const params = withChatMode(
      new URLSearchParams(
        'mode=workflow&workflow=workflow-1&thread=thread-1',
      ),
      'chat',
    );

    expect(readChatMode(params)).toBe('chat');
    expect(readWorkflowParam(params)).toBeUndefined();
    expect(params.get('thread')).toBe('thread-1');
  });

  it('removes a stale selected workflow without changing other state', () => {
    const params = withWorkflowParam(
      new URLSearchParams('mode=workflow&workflow=old&thread=thread-1'),
      undefined,
    );

    expect(params.get('workflow')).toBeNull();
    expect(params.get('mode')).toBe('workflow');
    expect(params.get('thread')).toBe('thread-1');
  });
});
