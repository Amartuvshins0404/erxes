import { DefaultChatTransport, type UIMessageChunk } from 'ai';
import { REACT_APP_API_URL } from 'erxes-ui';
import { AgentUIMessage } from '~/modules/chat/types';
import { messageText } from '~/modules/chat/lib/uiParts';

// The chat stream endpoint, proxied through the gateway. The backend builds the
// turn from Mongo history + the new user message, so the transport sends erxes's
// own body fields (agentId / threadId / message / per-send options) rather than
// the default UIMessage array.
const STREAM_URL = `${REACT_APP_API_URL}/pl:erxes-agent/chat/stream`;

const lastUserText = (messages: AgentUIMessage[]): string => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messageText(messages[i]);
  }
  return '';
};

// A DefaultChatTransport that reports the moment the turn's `finish` chunk
// passes through. The server writes `finish` as soon as the reply is complete,
// then keeps the SSE stream open for the off-critical-path reconcile tail
// (turn summary, native message id, thread title) — and the AI SDK only flips
// `status` back to 'ready' when the stream CLOSES. Without this signal the UI
// would sit in "Working…" (stop button, shimmer) for seconds after the answer
// is fully rendered.
class SettlingChatTransport extends DefaultChatTransport<AgentUIMessage> {
  private readonly onFinishChunk: () => void;

  constructor(
    options: ConstructorParameters<
      typeof DefaultChatTransport<AgentUIMessage>
    >[0],
    onFinishChunk: () => void,
  ) {
    super(options);
    this.onFinishChunk = onFinishChunk;
  }

  protected override processResponseStream(
    stream: ReadableStream<Uint8Array>,
  ): ReadableStream<UIMessageChunk> {
    const { onFinishChunk } = this;
    return super.processResponseStream(stream).pipeThrough(
      new TransformStream<UIMessageChunk, UIMessageChunk>({
        transform(chunk, controller) {
          if (chunk.type === 'finish') onFinishChunk();
          controller.enqueue(chunk);
        },
      }),
    );
  }
}

// One transport per (agent, thread): `agentId`/`threadId` are baked in; the
// per-send `body` (reasoningEffort / attachments / approvedOperations) is merged
// on top by `chat.sendMessage(_, { body })`. `onFinishChunk` fires when the
// turn's `finish` chunk arrives — i.e. the reply is done writing, even though
// the stream stays open for the reconcile tail.
export const createChatTransport = (
  mastraAgentId: string,
  threadId: string,
  onFinishChunk: () => void,
): DefaultChatTransport<AgentUIMessage> =>
  new SettlingChatTransport(
    {
      api: STREAM_URL,
      credentials: 'include',
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: {
          agentId: mastraAgentId,
          threadId,
          message: lastUserText(messages),
          ...(body ?? {}),
        },
      }),
    },
    onFinishChunk,
  );
