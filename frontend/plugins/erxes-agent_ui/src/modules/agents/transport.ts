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

/**
 * The ask_user answer staged by the hook, plus the suspended tool call it
 * resolves. The tool call id scopes the transport's chunk filter to the
 * suspension replay so the resumed run's own tool results still reach the UI.
 */
export interface IPendingAnswer {
  answer: string | string[] | (string | string[])[];
  suspendedToolCallId?: string;
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
   * consumes it exactly once in `sendMessages` — which the hook triggers
   * right after staging — turning that one request into the
   * `POST /agents/answer` resume call. A batched multi-question card
   * answers positionally: element i answers question i (a string, or a
   * string array for that question's multi-select).
   */
  consumePendingAnswer: () => IPendingAnswer | undefined;
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
 * - Normal sends go to `POST /agents/chat`; the hook pins the conversation
 *   by generating the thread id client-side and including it in the body
 *   (`threadId`) on every turn. The response header `X-Agents-Thread-Id` is
 *   captured through the transport's `fetch` middleware as advisory only —
 *   a cross-origin browser cannot read a custom header unless the gateway
 *   exposes it, so continuity must never depend on it.
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

  private readonly consumePendingAnswer: () => IPendingAnswer | undefined;

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
    // An ask_user answer travels as a normal send: the hook stages the answer
    // and sends a user message carrying it, and this branch reroutes that one
    // request to the answer resume endpoint. The send-side stream state keeps
    // the real transcript snapshot, so the resumed chunks apply cleanly —
    // the SDK's resume path would build an empty state and discard them.
    const pendingAnswer = this.consumePendingAnswer();

    if (pendingAnswer !== undefined) {
      return this.postAnswerResume(pendingAnswer, options.abortSignal);
    }

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
   * POSTs the ask_user answer to the answer resume endpoint and returns the
   * resumed stream. The resumed run replays the suspension's resolution as
   * chunks tagged with the PREVIOUS turn's tool call id, which the send-side
   * streaming state cannot match (the SDK throws "must be preceded by a
   * tool-input-available" and discards the whole stream; the hook marks the
   * tool part answered locally instead). Only those replay chunks are
   * dropped — every other chunk, including the resumed run's own tool
   * inputs and outputs, flows through to the UI.
   */
  private async postAnswerResume(
    pendingAnswer: IPendingAnswer,
    abortSignal?: AbortSignal,
  ): Promise<ReadableStream<UIMessageChunk>> {
    const threadId = this.getThreadId();

    if (!threadId) {
      throw new Error('Cannot answer without an active agents thread.');
    }

    const body: Record<string, unknown> = {
      threadId,
      answer: pendingAnswer.answer,
      // The resumed run continues on the same provider/model/thinking the
      // UI used for the suspended turn.
      ...selectionToBody(this.getRequestSelection()),
    };

    const response = await fetch(AGENTS_ANSWER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to send the answer.');
    }

    if (!response.body) {
      throw new Error('The response body is empty.');
    }

    const suspendedToolCallId = pendingAnswer.suspendedToolCallId;

    return this.processResponseStream(response.body).pipeThrough(
      new TransformStream<UIMessageChunk, UIMessageChunk>({
        transform(chunk, controller) {
          if (
            suspendedToolCallId &&
            'toolCallId' in chunk &&
            chunk.toolCallId === suspendedToolCallId
          ) {
            return;
          }

          controller.enqueue(chunk);
        },
      }),
    );
  }

  /**
   * True stream reconnects are unsupported: the backend keeps no
   * reconnectable stream per chat, so a reconnect stays a no-op and a page
   * reload simply starts a fresh request against stored memory.
   */
  async reconnectToStream(_options: {
    abortSignal?: AbortSignal;
  }): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
