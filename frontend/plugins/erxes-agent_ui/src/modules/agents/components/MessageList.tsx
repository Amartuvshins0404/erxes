import type { UIMessage } from 'ai';
import { ScrollArea } from 'erxes-ui';
import { Fragment, useEffect, useRef } from 'react';

import { MESSAGE_AVATAR_SHUFFLE_POOL } from '../botCycles';
import { BloubBot } from './BloubBot';
import { MessagePartRenderer } from './MessagePart';

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
  onAnswer: (answer: string | string[]) => void;
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
const hasPendingAskUser = (message: UIMessage): boolean =>
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
    } | null;

    return data?.toolName === 'askUser';
  });

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
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        {messages.map((message, index) => {
          const createdAt = getMessageCreatedAt(message);
          const previousCreatedAt =
            index > 0 ? getMessageCreatedAt(messages[index - 1]) : null;
          const showTimestamp =
            createdAt !== null &&
            previousCreatedAt !== null &&
            createdAt - previousCreatedAt > TIMESTAMP_GAP_MS;

          // Contextual message avatar:
          // - the streaming tail (last message, run in flight) keeps the
          //   three-dots thinking state so the live reply reads as work;
          // - a pending ask_user question opens the eyes wide;
          // - every settled message plays the random shuffle walk, the
          //   "lot of relevant variants" transition, sized-stable.
          const isStreamingTail =
            index === messages.length - 1 &&
            (status === 'streaming' || status === 'submitted');
          const asking = hasPendingAskUser(message);
          const partProps = {
            approvalBusy,
            onApprovalRespond,
            answerBusy,
            onAnswer,
          };

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
                  <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
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
                <div className="flex gap-3">
                  <BloubBot
                    size={28}
                    {...(isStreamingTail
                      ? { state: 'thinking' as const }
                      : asking
                        ? { state: 'wide' as const }
                        : {
                            shuffle: MESSAGE_AVATAR_SHUFFLE_POOL,
                          })}
                    className="shrink-0 mt-0.5"
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
            <div className="flex gap-3 text-[11px] text-muted-foreground md:text-xs">
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
