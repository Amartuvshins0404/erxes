import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation } from '@apollo/client';
import {
  AlertDialog,
  Button,
  buttonVariants,
  formatDateISOStringToRelativeDateShort,
  toast,
} from 'erxes-ui';
import { Fragment, useMemo, useState } from 'react';

import { AGENTS_THREADS, AGENTS_THREAD_REMOVE } from '../graphql/threads';
import type {
  IAgentsThreadRemoveData,
  IAgentsThreadRemoveVariables,
} from '../graphql/threads';
import type { IUseAgentsThreadsResult } from '../hooks/useAgentsThreads';
import type { IAgentsThread } from '../types';
import { BloubBot } from './BloubBot';

export interface IThreadListProps {
  threadsState: IUseAgentsThreadsResult;
  activeThreadId: string | undefined;
  onSelectThread: (threadId: string) => void;
  onNewConversation: () => void;
  /** Called after a thread has been deleted successfully. */
  onThreadDeleted?: (threadId: string) => void;
}

/** Loading placeholder rows shown while the first page is still in flight. */
const SKELETON_ROWS = 5;

type IThreadGroup = { key: string; label: string; threads: IAgentsThread[] };

/**
 * Buckets threads into Today / Yesterday / Previous 7 days / Older so the
 * list scans like a session history instead of one undifferentiated feed.
 */
const groupThreads = (threads: IAgentsThread[]): IThreadGroup[] => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const buckets = new Map<string, IThreadGroup>([
    ['today', { key: 'today', label: 'Today', threads: [] }],
    ['yesterday', { key: 'yesterday', label: 'Yesterday', threads: [] }],
    [
      'week',
      { key: 'week', label: 'Previous 7 days', threads: [] },
    ],
    ['older', { key: 'older', label: 'Older', threads: [] }],
  ]);

  for (const thread of threads) {
    const updatedAt = thread.updatedAt ? new Date(thread.updatedAt) : null;

    if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
      buckets.get('older')?.threads.push(thread);
      continue;
    }

    const time = updatedAt.getTime();

    if (time >= startOfToday) {
      buckets.get('today')?.threads.push(thread);
    } else if (time >= startOfToday - dayMs) {
      buckets.get('yesterday')?.threads.push(thread);
    } else if (time >= startOfToday - 7 * dayMs) {
      buckets.get('week')?.threads.push(thread);
    } else {
      buckets.get('older')?.threads.push(thread);
    }
  }

  return [...buckets.values()].filter((group) => group.threads.length > 0);
};

/**
 * Sidebar list of the user's agents conversations: sessions grouped by
 * activity (Today / Yesterday / Previous 7 days / Older), an accent rail on
 * the active session, hover-revealed delete, and the sleeping bot on the
 * empty state. Grouping is derived purely from `updatedAt`, so it works both
 * in the full-page sidebar and the floating panel without extra data.
 */
export const ThreadList = ({
  threadsState,
  activeThreadId,
  onSelectThread,
  onNewConversation,
  onThreadDeleted,
}: IThreadListProps) => {
  const { threads, loading, error } = threadsState;
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const groups = useMemo(() => groupThreads(threads), [threads]);

  const [removeThread, { loading: removing }] = useMutation<
    IAgentsThreadRemoveData,
    IAgentsThreadRemoveVariables
  >(AGENTS_THREAD_REMOVE, {
    refetchQueries: [{ query: AGENTS_THREADS }],
    onCompleted: () => {
      if (threadToDelete) {
        onThreadDeleted?.(threadToDelete);
      }

      setThreadToDelete(null);
      toast({ title: 'Conversation deleted' });
    },
    onError: (removeError) => {
      toast({
        title: 'Failed to delete the conversation',
        description: removeError.message,
        variant: 'destructive',
      });
    },
  });

  const handleConfirmDelete = () => {
    if (!threadToDelete || removing) {
      return;
    }

    void removeThread({ variables: { threadId: threadToDelete } });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Conversations
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onNewConversation}
          aria-label="New conversation"
        >
          <IconPlus className="size-3.5" />
          New
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1">
        {loading && threads.length === 0 && (
          <div className="space-y-1.5" aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <div
                key={index}
                className="space-y-1.5 rounded-xl px-3 py-2.5"
              >
                <span
                  className="block h-3 animate-pulse rounded bg-accent"
                  style={{ width: `${60 + ((index * 13) % 35)}%` }}
                />
                <span className="block h-2 w-1/4 animate-pulse rounded bg-accent/70" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && threads.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 px-3 py-8 text-center">
            {/* The bot naps while there is nothing to show. */}
            <BloubBot size={56} state="sleep" />
            <p className="text-xs text-muted-foreground">
              No conversations yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 h-7 gap-1 rounded-full px-3 text-xs"
              onClick={onNewConversation}
            >
              <IconPlus className="size-3.5" />
              Start one
            </Button>
          </div>
        )}

        {groups.map((group) => (
          <Fragment key={group.key}>
            <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 first:pt-1">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.threads.map((thread) => {
                const isActive = thread.id === activeThreadId;

                return (
                  <li key={thread.id}>
                    <div
                      className={`group relative flex items-center rounded-xl py-2 pl-3.5 pr-1 transition-colors ${
                        isActive
                          ? 'bg-primary/10'
                          : 'hover:bg-accent/60'
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectThread(thread.id)}
                        className="min-w-0 flex-1 py-0.5 text-left"
                      >
                        <span
                          className={`block truncate text-[13px] leading-tight md:text-[13.5px] ${
                            isActive
                              ? 'font-medium text-foreground'
                              : 'font-normal text-foreground/90'
                          }`}
                        >
                          {thread.title || 'Untitled conversation'}
                        </span>
                        {thread.updatedAt && (
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                            {formatDateISOStringToRelativeDateShort(
                              thread.updatedAt,
                            )}
                          </span>
                        )}
                      </button>
                      {/* Always visible where there is no reliable hover
                          (touch, and the drawer below `lg`); hover-revealed
                          only on the roomier pointer layouts. */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-muted-foreground transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 hover:text-destructive"
                        aria-label="Delete conversation"
                        onClick={() => setThreadToDelete(thread.id)}
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </div>

      <AlertDialog
        open={threadToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setThreadToDelete(null);
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete conversation</AlertDialog.Title>
            <AlertDialog.Description>
              This permanently deletes the conversation and its messages.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonVariants({ variant: 'destructive' })}
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();
                handleConfirmDelete();
              }}
            >
              Delete
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};
