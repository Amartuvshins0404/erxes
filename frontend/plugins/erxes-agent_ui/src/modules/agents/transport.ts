import { DefaultChatTransport, isToolUIPart } from 'ai';
import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';

import { AGENTS_ANSWER_URL, AGENTS_APPROVE_URL, AGENTS_CHAT_URL } from './api';

/** Header the backend stamps with the resolved thread id on every chat SSE. */
const THREAD_ID_HEADER = 'X-Agents-Thread-Id';

/** Model/thinking selection sent with every turn (empty provider = auto). */
export interface IAgentsRequestSelection {
  provider?: string;
  model?: string;
  thinkingLevel?: string;
}

export interface IAgentsChatTransportOptions {
  /** Returns the currently active thread id, if any. */
  getThreadId: () => string | undefined;
  /** Returns the current model/thinking selection for the next turn. */
  getRequestSelection: () => IAgentsRequestSelection;
  /** Called when the backend reports the thread id for this conversation. */
  onThreadId: (threadId: string) => void;
  /**
   * Returns the ask_user answer awaiting submission, if any. The transport
   * consumes it exactly once when reconnecting: a pending answer turns the
   * reconnect into the answer POST, and it is cleared on read so a later
   * reconnect (page reload) stays a no-op.
   */
  consumePendingAnswer: () => string | string[] | undefined;
}

const selectionToBody = (
  selection: IAgentsRequestSelection,
): Record<string, string> => {
  const body: Record<string, string> = {};

  if (selection.provider) {
    body.provider = selection.provider;
  }

  if (selection.model) {
    body.model = selection.model;
  }

  if (selection.thinkingLevel) {
    body.thinkingLevel = selection.thinkingLevel;
  }

  return body;
};

interface IApprovalDecision {
  approved: boolean;
  reason?: string;
}

/**
 * Finds the user's approval decision in the last assistant message, mirroring
 * the semantics of `lastAssistantMessageIsCompleteWithApprovalResponses`:
 * only tool parts after the last `step-start` of the last assistant message
 * count, and only an `approval-responded` part carries a decision.
 */
const extractApprovalDecision = (
  messages: UIMessage[],
): IApprovalDecision | null => {
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== 'assistant') {
    return null;
  }

  let lastStepStartIndex = -1;

  lastMessage.parts.forEach((part, index) => {
    if (part.type === 'step-start') {
      lastStepStartIndex = index;
    }
  });

  for (let index = lastMessage.parts.length - 1; index > lastStepStartIndex; index -= 1) {
    const part = lastMessage.parts[index];

    if (!isToolUIPart(part) || part.state !== 'approval-responded') {
      continue;
    }

    return {
      approved: part.approval?.approved === true,
      reason: part.approval?.reason,
    };
  }

  return null;
};

/**
 * Chat transport for erxes agents.
 *
 * Extends the AI SDK's `DefaultChatTransport` (the documented extension
 * point) instead of re-implementing SSE parsing or message state:
 *
 * - Normal sends go to `POST /agents/chat`; the response header
 *   `X-Agents-Thread-Id` is captured through the transport's `fetch`
 *   middleware so the UI can pin the conversation to its server thread.
 * - When the framework auto-resends after the user answered a tool approval
 *   (last message is the assistant's approval-responded message), the request
 *   is routed to `POST /agents/approve` with `{ threadId, approved, reason }`
 *   because the backend resumes the suspended Mastra run through its own
 *   endpoint instead of re-running the whole transcript.
 */
export class AgentsChatTransport
  extends DefaultChatTransport<UIMessage>
  implements ChatTransport<UIMessage>
{
  private readonly getThreadId: () => string | undefined;

  private readonly onThreadId: (threadId: string) => void;

  private readonly getRequestSelection: () => IAgentsRequestSelection;

  private readonly consumePendingAnswer: () => string | string[] | undefined;

  constructor({
    getThreadId,
    getRequestSelection,
    onThreadId,
    consumePendingAnswer,
  }: IAgentsChatTransportOptions) {
    super({
      api: AGENTS_CHAT_URL,
      credentials: 'include',
      body: () => {
        const body = selectionToBody(getRequestSelection());
        const threadId = getThreadId();

        if (threadId) {
          body.threadId = threadId;
        }

        return body;
      },
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const threadId = response.headers.get(THREAD_ID_HEADER);

        if (threadId) {
          onThreadId(threadId);
        }

        return response;
      },
    });

    this.getThreadId = getThreadId;
    this.getRequestSelection = getRequestSelection;
    this.onThreadId = onThreadId;
    this.consumePendingAnswer = consumePendingAnswer;
  }

  async sendMessages(
    options: Parameters<ChatTransport<UIMessage>['sendMessages']>[0],
  ): Promise<ReadableStream<UIMessageChunk>> {
    const decision = extractApprovalDecision(options.messages);

    if (!decision) {
      return super.sendMessages(options);
    }

    const threadId = this.getThreadId();

    if (!threadId) {
      throw new Error(
        'Cannot resume an approval without an active agents thread.',
      );
    }

    const body: Record<string, unknown> = {
      threadId,
      approved: decision.approved,
      // The resumed run continues on the same provider/model/thinking the
      // UI used for the suspended turn.
      ...selectionToBody(this.getRequestSelection()),
    };

    if (decision.reason) {
      body.reason = decision.reason;
    }

    const response = await fetch(AGENTS_APPROVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to fetch the approval response.');
    }

    if (!response.body) {
      throw new Error('The response body is empty.');
    }

    return this.processResponseStream(response.body);
  }

  /**
   * The reconnect path doubles as the ask_user answer submission: when the
   * hook holds a pending answer, the reconnect POSTs to `POST /agents/answer`
   * and returns the resumed SSE stream, which the chat's resume state machine
   * consumes exactly like any other streaming response. With no pending
   * answer a reconnect stays a no-op (the backend has no stream-reconnect
   * endpoint; a page reload simply starts a fresh request against stored
   * memory). The pending answer is consumed exactly once so a subsequent
   * reconnect never replays it.
   */
  async reconnectToStream(options: {
    abortSignal?: AbortSignal;
  }): Promise<ReadableStream<UIMessageChunk> | null> {
    const answer = this.consumePendingAnswer();

    if (answer === undefined) {
      return null;
    }

    const threadId = this.getThreadId();

    if (!threadId) {
      throw new Error('Cannot answer without an active agents thread.');
    }

    const body: Record<string, unknown> = {
      threadId,
      answer,
      // The resumed run continues on the same provider/model/thinking the
      // UI used for the suspended turn.
      ...selectionToBody(this.getRequestSelection()),
    };

    const response = await fetch(AGENTS_ANSWER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: options.abortSignal,
    });

    const threadIdHeader = response.headers.get(THREAD_ID_HEADER);

    if (threadIdHeader) {
      this.onThreadId(threadIdHeader);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to send the answer.');
    }

    if (!response.body) {
      throw new Error('The response body is empty.');
    }

    return this.processResponseStream(response.body);
  }
}
