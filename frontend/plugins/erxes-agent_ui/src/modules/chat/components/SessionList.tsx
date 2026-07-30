import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  IconChevronLeft,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { Button, Skeleton } from 'erxes-ui';
import { IMastraThread } from '~/modules/chat/types';
import { useThreadWorking } from '~/modules/chat/hooks/useChatView';

type DeleteHandler = (
  e: ReactMouseEvent | ReactKeyboardEvent,
  threadId: string,
) => void;

type RenameHandler = (id: string, threadId: string, title: string) => void;

interface SessionItemProps {
  session: IMastraThread;
  agentId: string;
  active: boolean;
  onSelect: (threadId: string) => void;
  onDelete: DeleteHandler;
  onRename: RenameHandler;
}

const SessionItem = ({
  session,
  agentId,
  active,
  onSelect,
  onDelete,
  onRename,
}: SessionItemProps) => {
  const working = useThreadWorking(agentId, session.threadId);
  const title = session.title || 'New chat';
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  // Focus the rename field when it mounts. A stable callback ref (not autoFocus,
  // which the a11y rule flags, and not an inline ref that re-fires every render).
  const focusOnMount = useCallback((el: HTMLInputElement | null) => {
    el?.focus();
  }, []);

  const beginEdit = () => {
    setDraftTitle(title);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const next = draftTitle.trim();
    if (next && next !== title) {
      onRename(session._id, session.threadId, next);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(session.threadId)}
      className={`group/sess w-full text-left rounded-md px-2.5 py-2 transition-colors hover:bg-accent ${
        active || working ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-center gap-1.5">
        {editing ? (
          <input
            ref={focusOnMount}
            aria-label="Session title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={commit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(false);
              }
            }}
            className="text-sm flex-1 min-w-0 bg-transparent outline-none border-b border-primary"
          />
        ) : (
          // The title is the session's summary — the whole row. It shimmers
          // while that session is generating a reply.
          <p
            className={`flex-1 truncate text-sm ${working ? 'ea-shimmer-text' : ''}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              beginEdit();
            }}
          >
            {title}
          </p>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => onDelete(e, session.threadId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onDelete(e, session.threadId);
            }
          }}
          className="opacity-0 group-hover/sess:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        >
          <IconTrash className="size-3.5" />
        </span>
      </div>
    </button>
  );
};

interface SessionListProps {
  agentId: string;
  sessions: IMastraThread[];
  sessionsLoaded: boolean;
  isDraft: boolean;
  activeThreadId?: string;
  onSelect: (threadId: string) => void;
  onNew: () => void;
  onDelete: DeleteHandler;
  onRename: RenameHandler;
  onBack?: () => void;
}

export const SessionList = ({
  agentId,
  sessions,
  sessionsLoaded,
  isDraft,
  activeThreadId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onBack,
}: SessionListProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-1">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={onBack}
              title="Back to agents"
            >
              <IconChevronLeft className="size-3.5" />
            </Button>
          )}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sessions
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-6" onClick={onNew}>
          <IconPlus className="size-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-1.5 space-y-0.5">
        {!sessionsLoaded ? (
          <div className="space-y-1.5 p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <>
            {isDraft && (
              <div
                className={`rounded-md px-2.5 py-2 ${
                  activeThreadId &&
                  !sessions.some((s) => s.threadId === activeThreadId)
                    ? 'bg-accent'
                    : ''
                }`}
              >
                <p className="truncate text-sm text-muted-foreground">
                  New chat
                </p>
              </div>
            )}
            {sessions.length === 0 && !isDraft ? (
              <p className="text-xs text-muted-foreground px-2.5 py-3">
                No sessions yet.
              </p>
            ) : (
              sessions.map((s) => (
                <SessionItem
                  key={s.threadId}
                  session={s}
                  agentId={agentId}
                  active={s.threadId === activeThreadId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
