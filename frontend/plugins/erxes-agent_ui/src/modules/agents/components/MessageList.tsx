import { isTextUIPart, isToolUIPart, type UIMessage } from 'ai';
import { ScrollArea } from 'erxes-ui';
import { Fragment, useEffect, useRef } from 'react';

import { MESSAGE_AVATAR_SHUFFLE_POOL } from '../botCycles';
import { formatAskUserAnswers } from '../askUserAnswers';
import { BloubBot } from './BloubBot';
import {
  hasVisibleParts,
  MessagePartRenderer,
  readMessageAskUserAnswerCard,
} from './MessagePart';

export interface IMessageListProps {
  messages: UIMessage[];
  status: string;
  loadingThread: boolean;
  approvalBusy: boolean;
  onApprovalRespond: (decision: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => void;
  answerBusy: boolean;
  onAnswer: (answer: string | string[] | (string | string[])[]) => void;
}

/** Show a timestamp divider only after gaps longer than this. */
const TIMESTAMP_GAP_MS = 10 * 60 * 1000;
/** Distance from the bottom (px) that still counts as "near bottom". */
const NEAR_BOTTOM_THRESHOLD = 120;

/**
 * Reads `metadata.createdAt` (present on history messages mapped from the
 * server) as an epoch-ms timestamp. Live-streamed messages carry no
 * metadata; those silently yield `null`.
 */
const getMessageCreatedAt = (message: UIMessage): number | null => {
  const { metadata } = message;

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const { createdAt } = metadata as { createdAt?: unknown };

  if (typeof createdAt !== 'string') {
    return null;
  }

  const parsed = new Date(createdAt).getTime();

  return Number.isNaN(parsed) ? null : parsed;
};

const formatTimestamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Detects whether a message contains a pending ask_user question (an
 * unanswered suspension data part) — the message avatar opens its eyes wide
 * while the assistant waits.
 */
const hasPendingAskUser = (
  message: UIMessage,
  answeredToolCallIds: Set<string>,
): boolean =>
  message.parts.some((part) => {
    if (
      typeof part !== 'object' ||
      part === null ||
      !('type' in part) ||
      (part as { type: string }).type !== 'data-tool-call-suspended'
    ) {
      return false;
    }

    const data = (part as { data?: unknown }).data as {
      toolName?: string;
      toolCallId?: string;
    } | null;

    return (
      data?.toolName === 'askUser' &&
      !!data.toolCallId &&
      !answeredToolCallIds.has(data.toolCallId)
    );
  });

/**
 * Ask_user answers travel through the send pipeline as user messages (the
 * transport reroutes them to the answer endpoint), but they display as the
 * assistant's answered Q&A card — never as a bubble of their own. The send
 * marks them with `metadata.agentsAnswer`.
 */
const isAgentsAnswerTurn = (message: UIMessage): boolean => {
  const { metadata } = message;

  return (
    !!metadata &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    (metadata as { agentsAnswer?: unknown }).agentsAnswer === true
  );
};

const getMessageText = (message: UIMessage): string =>
  message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('');

/**
 * Scrollable transcript. Follows the inbox ScrollArea viewport pattern:
 * sticks to the bottom while new content streams in, and pauses auto-scroll
 * as soon as the user scrolls up. The empty state lives in `ChatPanel`, which
 * pairs it with the composer; this component only renders history plus its
 * loading state.
 */
export const MessageList = ({
  messages,
  status,
  loadingThread,
  approvalBusy,
  onApprovalRespond,
  answerBusy,
  onAnswer,
}: IMessageListProps) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const prevLoadingThreadRef = useRef(loadingThread);

  const lastMessagePartsLength =
    messages[messages.length - 1]?.parts.length ?? 0;

  const handleScroll = () => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    nearBottomRef.current =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
      NEAR_BOTTOM_THRESHOLD;
  };

  useEffect(() => {
    const wasLoadingThread = prevLoadingThreadRef.current;
    prevLoadingThreadRef.current = loadingThread;

    // A new conversation clears the transcript: re-arm auto-scroll so the
    // first reply lands at the bottom.
    if (messages.length === 0) {
      nearBottomRef.current = true;
      return;
    }

    if (loadingThread) {
      return;
    }

    // After openThread finishes loading history, always jump to the bottom
    // regardless of where the user had scrolled in the previous thread.
    const threadJustLoaded = wasLoadingThread && !loadingThread;

    if (threadJustLoaded) {
      nearBottomRef.current = true;
    }

    if (!nearBottomRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const viewport = viewportRef.current;

      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [messages.length, lastMessagePartsLength, loadingThread]);

  if (loadingThread) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
        <BloubBot size={48} state="thinking" />
        <p className="text-xs text-muted-foreground">Loading conversation…</p>
      </div>
    );
  }

  return (
    <ScrollArea.Root className="min-h-0 flex-1">
      <ScrollArea.Viewport ref={viewportRef} onScroll={handleScroll}>
        <div className="mx-auto w-full max-w-2xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 md:max-w-3xl">
        {messages.map((message, index) => {
          if (message.role === 'user' && isAgentsAnswerTurn(message)) {
            return null;
          }

          // Answer turns from before the backend stopped storing them as
          // their own user message have no marker in history. The answered
          // Q&A card on the ask_user assistant message right above already
          // carries the answers, so hide a directly following bubble whose
          // text is exactly what those answers format back to.
          if (
            message.role === 'user' &&
            index > 0 &&
            messages[index - 1]!.role === 'assistant'
          ) {
            const answerCard = readMessageAskUserAnswerCard(messages[index - 1]!);

            if (
              answerCard &&
              getMessageText(message) === formatAskUserAnswers(answerCard)
            ) {
              return null;
            }
          }

          const createdAt = getMessageCreatedAt(message);
          const previousCreatedAt =
            index > 0 ? getMessageCreatedAt(messages[index - 1]) : null;
          const showTimestamp =
            createdAt !== null &&
            previousCreatedAt !== null &&
            createdAt - previousCreatedAt > TIMESTAMP_GAP_MS;

          // Contextual message avatar:
          // - the streaming tail (last message, run in flight) plays the
          //   writing state so the live reply reads as the bot writing it;
          // - a pending ask_user question opens the eyes wide;
          // - every settled message plays the random shuffle walk, the
          //   "lot of relevant variants" transition, sized-stable.
          const isStreamingTail =
            index === messages.length - 1 &&
            (status === 'streaming' || status === 'submitted');
          // Tool calls already resolved (e.g. an answered ask_user): their
          // suspension cards must stop rendering even though the suspension
          // data part stays in the message.
          const answeredToolCallIds = new Set(
            message.parts
              .filter(isToolUIPart)
              .filter(
                (part) =>
                  part.state === 'output-available' ||
                  part.state === 'output-error',
              )
              .map((part) => part.toolCallId),
          );
          const asking = hasPendingAskUser(message, answeredToolCallIds);
          const partProps = {
            approvalBusy,
            onApprovalRespond,
            answerBusy,
            onAnswer,
            answeredToolCallIds,
          };

          // Fully hide turns with nothing left to show: an assistant message
          // whose only parts are resolved cards (or other hidden tool state)
          // must not leave an empty avatar-only row behind.
          if (
            message.role === 'assistant' &&
            !isStreamingTail &&
            !hasVisibleParts(message.parts, answeredToolCallIds)
          ) {
            return null;
          }

          return (
            <Fragment key={message.id}>
              {showTimestamp && createdAt !== null && (
                <div className="flex justify-center">
                  <span className="text-[11px] text-muted-foreground">
                    {formatTimestamp(createdAt)}
                  </span>
                </div>
              )}
              {message.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground sm:max-w-[85%]">
                    {message.parts.map((part, partIndex) => (
                      <MessagePartRenderer
                        key={`${message.id}-${partIndex}`}
                        part={part}
                        role={message.role}
                        {...partProps}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 sm:gap-3">
                  <BloubBot
                    size={28}
                    {...(isStreamingTail
                      ? { state: 'writing' as const }
                      : asking
                        ? { state: 'wide' as const }
                        : {
                            shuffle: MESSAGE_AVATAR_SHUFFLE_POOL,
                          })}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    {message.parts.map((part, partIndex) => (
                      <MessagePartRenderer
                        key={`${message.id}-${partIndex}`}
                        part={part}
                        role={message.role}
                        {...partProps}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
          {status === 'submitted' && (
            <div className="flex gap-2 text-[11px] text-muted-foreground sm:gap-3 sm:text-xs">
              <BloubBot
                size={24}
                state="thinking"
                className="shrink-0"
              />
              <span className="pt-1">Thinking…</span>
            </div>
          )}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Bar orientation="vertical" />
    </ScrollArea.Root>
  );
};
