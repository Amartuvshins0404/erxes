import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useLazyQuery } from '@apollo/client';
import { useCallback, useMemo, useRef, useState } from 'react';

import { AGENTS_THREAD_DETAIL } from '../graphql/threads';
import type { IAgentsThreadDetailData } from '../graphql/threads';
import { mapStoredMessagesToUIMessages } from '../mapStoredMessages';
import type { IAgentsRequestSelection } from '../transport';
import { AgentsChatTransport } from '../transport';

/** Thinking depth selectable per turn in the chat UI. */
export type IAgentsThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high';

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
  /** Submits the answer to the thread's suspended ask_user question. */
  submitAnswer: (answer: string | string[]) => void;
}

/**
 * Agents chat state built on the AI SDK's `useChat` with a custom
 * `AgentsChatTransport`. The framework owns message state, streaming, and
 * tool-approval handling; this hook only adds:
 *
 * - server thread tracking (learned from the `X-Agents-Thread-Id` header),
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
   * The ask_user answer awaiting submission. Set by `submitAnswer`, read
   * exactly once by the transport's reconnect path (which turns it into the
   * `POST /agents/answer` resume request), and cleared on read so a later
   * reconnect (page reload) stays a no-op.
   */
  const pendingAnswerRef = useRef<string | string[] | undefined>(undefined);

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
   * Submits the answer to the suspended ask_user question: stage it on the
   * transport and trigger the chat's resume path, whose reconnect consumer
   * POSTs to `/agents/answer` and pipes the resumed stream through the same
   * state machine as any other turn.
   */
  const submitAnswer = useCallback(
    (answer: string | string[]) => {
      if (chat.status !== 'ready') {
        return;
      }

      pendingAnswerRef.current = answer;
      setAnswerBusy(true);
      void chat.resumeStream().finally(() => setAnswerBusy(false));
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
    sendMessage: chat.sendMessage,
    addToolApprovalResponse: chat.addToolApprovalResponse,
    stop: chat.stop,
    clearError: chat.clearError,
    startNewConversation,
    openThread,
    answerBusy,
    submitAnswer,
  };
};
