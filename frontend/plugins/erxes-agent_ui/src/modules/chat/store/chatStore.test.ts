jest.mock('erxes-ui', () => ({
  REACT_APP_API_URL: 'http://localhost:4000',
}));

import { Chat } from '@ai-sdk/react';
import { chatStore, useChatStore } from '~/modules/chat/store/chatStore';
import type { AgentUIMessage } from '~/modules/chat/types';

const message = (
  id: string,
  role: 'user' | 'assistant',
  messageId?: string,
): AgentUIMessage => ({
  id,
  role,
  parts: [],
  metadata: messageId ? { messageId } : undefined,
});

describe('chatStore imperative facade', () => {
  afterEach(() => {
    useChatStore.setState({ chats: {} });
  });

  it('removes a deleted prompt and reply from the active Chat', () => {
    const chat = new Chat<AgentUIMessage>({
      messages: [
        message('ui-user-1', 'user'),
        message('ui-assistant-1', 'assistant', 'native-assistant-1'),
        message('ui-user-2', 'user', 'native-user-2'),
        message('ui-assistant-2', 'assistant', 'native-assistant-2'),
      ],
    });
    useChatStore.setState({ chats: { 'agent-1:thread-1': chat } });

    chatStore.discardMessagePair('agent-1', 'thread-1', 'ui-user-1', [
      'native-user-1',
      'native-assistant-1',
    ]);

    expect(chat.messages.map(({ id }) => id)).toEqual([
      'ui-user-2',
      'ui-assistant-2',
    ]);
  });
});
