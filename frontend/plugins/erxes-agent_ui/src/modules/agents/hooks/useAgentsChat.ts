import {
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from 'ai';
import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useLazyQuery } from '@apollo/client';
import { useCallback, useMemo, useRef, useState } from 'react';

import { AGENTS_THREAD_DETAIL } from '../graphql/threads';
import type { IAgentsThreadDetailData } from '../graphql/threads';
import { mapStoredMessagesToUIMessages } from '../mapStoredMessages';
import type { IAgentsRequestSelection, IPendingAnswer } from '../transport';
import { AgentsChatTransport } from '../transport';

/** Thinking depth selectable per turn in the chat UI. */
export type IAgentsThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high';

/**
 * Finds the suspended ask_user tool call in an assistant message: the
 * `data-tool-call-suspended` data part carries the tool call id that the
 * message's tool part is keyed by.
 */
const findAskUserSuspension = (
  message: UIMessage | undefined,
): { toolCallId: string } | null => {
  if (!message || message.role !== 'assistant') {
    return null;
  }

  for (const part of message.parts) {
    const typed = part as {
      type: string;
      data?: { toolName?: string; toolCallId?: string };
    };

    if (
      typed.type === 'data-tool-call-suspended' &&
      typed.data?.toolName === 'askUser' &&
      typed.data.toolCallId
    ) {
      return { toolCallId: typed.data.toolCallId };
    }
  }

  return null;
};

export interface IUseAgentsChatResult {
  messages: UIMessage[];
  status: ReturnType<typeof useChat<UIMessage>>['status'];
  error: Error | undefined;
  threadId: string | undefined;
  loadingThread: boolean;
  sendMessage: ReturnType<typeof useChat<UIMessage>>['sendMessage'];
  addToolApprovalResponse: ReturnType<
    typeof useChat<UIMessage>
  >['addToolApprovalResponse'];
  stop: ReturnType<typeof useChat<UIMessage>>['stop'];
  clearError: ReturnType<typeof useChat<UIMessage>>['clearError'];
  /** Starts a fresh conversation, dropping the local transcript and thread. */
  startNewConversation: () => void;
  /** Loads an existing thread's stored messages into the chat. */
  openThread: (threadId: string) => Promise<void>;
  /** Current model/thinking selection; empty provider means server default. */
  modelProvider: string;
  modelId: string;
  thinkingLevel: IAgentsThinkingLevel;
  /** Picks the provider/model the next turns run on ('' = auto). */
  selectModel: (provider: string, model: string) => void;
  selectThinkingLevel: (level: IAgentsThinkingLevel) => void;
  /** True while an ask_user answer is being submitted and resumed. */
  answerBusy: boolean;
  /**
   * Submits the answer(s) to the thread's suspended ask_user question(s):
   * a bare string (or string array for one multi-select question) for a
   * single-question card, or one entry per question positionally for a
   * batched card.
   */
  submitAnswer: (answer: string | string[] | (string | string[])[]) => void;
}

/**
 * Agents chat state built on the AI SDK's `useChat` with a custom
 * `AgentsChatTransport`. The framework owns message state, streaming, and
 * tool-approval handling; this hook only adds:
 *
 * - thread continuity: the thread id is generated client-side on the first
 *   send (`crypto.randomUUID()`) and pinned to every subsequent turn in the
 *   request body. The backend accepts client-supplied ids (auto-creating
 *   unknown ones, 403 for foreign threads). The `X-Agents-Thread-Id`
 *   response header is still captured when readable, but a cross-origin
 *   caller cannot read it unless the gateway exposes it, so it must never
 *   be the sole carrier of the id,
 * - automatic resend after an approval decision via the SDK's native
 *   `sendAutomaticallyWhen` predicate (the transport routes that resend to
 *   the backend's `/agents/approve` resume endpoint),
 * - loading stored threads via the `agentsThreadDetail` GraphQL query and
 *   starting new conversations.
 */
export const useAgentsChat = (): IUseAgentsChatResult => {
  const [threadId, setThreadId] = useState<string | undefined>();
  const [loadingThread, setLoadingThread] = useState(false);
  const [modelProvider, setModelProvider] = useState('');
  const [modelId, setModelId] = useState('');
  const [thinkingLevel, setThinkingLevel] =
    useState<IAgentsThinkingLevel>('off');
  const [answerBusy, setAnswerBusy] = useState(false);

  const threadIdRef = useRef<string | undefined>(undefined);
  const selectionRef = useRef<IAgentsRequestSelection>({});
  /**
   * The ask_user answer awaiting submission, with the suspended tool call it
   * resolves. Set by `submitAnswer`, read exactly once by the transport's
   * send path (which turns it into the `POST /agents/answer` resume request
   * and scopes its chunk filter to that tool call), and cleared on read so a
   * later send never replays it.
   */
  const pendingAnswerRef = useRef<IPendingAnswer | undefined>(undefined);

  /** Generates the conversation's thread id on first use. */
  const ensureThreadId = useCallback(() => {
    if (!threadIdRef.current) {
      threadIdRef.current = crypto.randomUUID();
      setThreadId(threadIdRef.current);
    }
  }, []);

  const transport = useMemo(
    () =>
      new AgentsChatTransport({
        getThreadId: () => threadIdRef.current,
        getRequestSelection: () => selectionRef.current,
        onThreadId: (nextThreadId) => {
          threadIdRef.current = nextThreadId;
          setThreadId(nextThreadId);
        },
        consumePendingAnswer: () => {
          const answer = pendingAnswerRef.current;
          pendingAnswerRef.current = undefined;
          return answer;
        },
      }),
    [],
  );

  const chat = useChat<UIMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  /**
   * Sends a turn after guaranteeing the conversation has a thread id, so the
   * very first request already carries one and every later turn pins the same
   * thread in the body.
   */
  const sendMessage = useCallback(
    (...args: Parameters<typeof chat.sendMessage>) => {
      ensureThreadId();

      return chat.sendMessage(...args);
    },
    [chat, ensureThreadId],
  );

  const selectModel = useCallback((nextProvider: string, nextModel: string) => {
    selectionRef.current = {
      ...selectionRef.current,
      provider: nextProvider,
      model: nextModel,
    };
    setModelProvider(nextProvider);
    setModelId(nextModel);
  }, []);

  const selectThinkingLevel = useCallback((level: IAgentsThinkingLevel) => {
    selectionRef.current = { ...selectionRef.current, thinkingLevel: level };
    setThinkingLevel(level);
  }, []);

  /**
   * Submits the answer to a suspended ask_user question: resolve the
   * suspended tool part locally, stage the answer (with its tool call id) on
   * the transport, then send a user message carrying the answer. The
   * transport reroutes that one request to `POST /agents/answer`, whose
   * resumed stream is processed by the send-side state machine — the SDK's
   * own resume path cannot apply it (it builds an empty streaming state, so
   * the resumed suspension replay finds no matching tool part and the whole
   * stream is discarded).
   */
  const submitAnswer = useCallback(
    (answer: string | string[] | (string | string[])[]) => {
      if (chat.status !== 'ready') {
        return;
      }

      setAnswerBusy(true);

      const answerText =
        typeof answer === 'string'
          ? answer
          : answer
              .map((part) => (Array.isArray(part) ? part.join(', ') : part))
              .join(' · ');
      const lastMessage = chat.messages[chat.messages.length - 1];
      const suspension = findAskUserSuspension(lastMessage);

      pendingAnswerRef.current = {
        answer,
        suspendedToolCallId: suspension?.toolCallId,
      };

      if (lastMessage && suspension) {
        // The spread over the tool-part union loses its discriminants, so the
        // patched array needs one explicit narrowing cast.
        const patchedParts = lastMessage.parts.map((part) => {
          if (
            isToolUIPart(part) &&
            part.toolCallId === suspension.toolCallId
          ) {
            return {
              ...part,
              state: 'output-available' as const,
              output: {
                content: `User answered: ${answerText}`,
                isError: false,
              },
            };
          }

          return part;
        }) as UIMessage['parts'];

        chat.setMessages([
          ...chat.messages.slice(0, -1),
          { ...lastMessage, parts: patchedParts },
        ]);
      }

      void chat
        .sendMessage({ text: answerText })
        .finally(() => setAnswerBusy(false));
    },
    [chat],
  );

  const [loadThreadDetail] =
    useLazyQuery<IAgentsThreadDetailData>(AGENTS_THREAD_DETAIL);

  const startNewConversation = useCallback(() => {
    threadIdRef.current = undefined;
    pendingAnswerRef.current = undefined;
    setThreadId(undefined);
    chat.setMessages([]);
    chat.clearError();
  }, [chat]);

  const openThread = useCallback(
    async (nextThreadId: string) => {
      setLoadingThread(true);

      try {
        const result = await loadThreadDetail({
          variables: { threadId: nextThreadId },
          fetchPolicy: 'network-only',
        });
        const detail = result.data?.agentsThreadDetail;

        if (!detail) {
          throw new Error('Thread not found.');
        }

        threadIdRef.current = nextThreadId;
        setThreadId(nextThreadId);
        chat.setMessages(mapStoredMessagesToUIMessages(detail.messages));
        chat.clearError();
      } finally {
        setLoadingThread(false);
      }
    },
    [chat, loadThreadDetail],
  );

  return {
    modelProvider,
    modelId,
    thinkingLevel,
    selectModel,
    selectThinkingLevel,
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    threadId,
    loadingThread,
    sendMessage,
    addToolApprovalResponse: chat.addToolApprovalResponse,
    stop: chat.stop,
    clearError: chat.clearError,
    startNewConversation,
    openThread,
    answerBusy,
    submitAnswer,
  };
};
