import { createContext, useCallback, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAssistantRuntime,
  useAssistantState,
  useThreadListItem,
} from '@assistant-ui/react';
import {
  IconLoader2,
  IconPlus,
  IconRobot,
  IconTrash,
} from '@tabler/icons-react';
import { Button, cn, Skeleton, useToast } from 'erxes-ui';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import {
  useAgentUnread,
  useAgentWorking,
  useThreadWorking,
} from '~/modules/chat/hooks/useChatView';
import { useMastraAgentRuntimeContext } from '~/modules/chat/runtime/MastraAgentRuntime';
import { DeleteSessionDialog } from '~/modules/chat/components/DeleteSessionDialog';

// Delete-confirmation bridge: item rows request a prompt, the sidebar root
// owns the dialog and runs the runtime delete on confirm.
const SessionDeleteContext = createContext<(threadId: string) => void>(
  () => undefined,
);

const AgentRow = ({
  agent,
  isActive,
}: {
  agent: IChatAgent;
  isActive: boolean;
}) => {
  const working = useAgentWorking(agent._id);
  const unread = useAgentUnread(agent._id);

  return (
    <Link
      to={`/erxes-agent/chat/${agent._id}`}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm min-w-0 transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-foreground/80 hover:bg-accent/60',
      )}
    >
      <IconRobot className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{agent.accountName}</span>
      {working && (
        <IconLoader2 className="size-3.5 shrink-0 animate-spin text-primary" />
      )}
      {unread && !working && (
        <span className="size-2 shrink-0 rounded-full bg-red-500" />
      )}
    </Link>
  );
};

// One conversation row — the primitives read the item runtime from context:
// Trigger switches the main thread, Title renders the (streamed) title.
const SessionListItem = () => {
  const { agentKey } = useMastraAgentRuntimeContext();
  const item = useThreadListItem();
  const threadId = item.remoteId ?? item.id;
  const working = useThreadWorking(agentKey, threadId);
  const requestDelete = useContext(SessionDeleteContext);

  return (
    <ThreadListItemPrimitive.Root
      className={cn(
        'group/session relative flex items-center rounded-md transition-colors',
        item.isMain ? 'bg-accent/70' : 'hover:bg-accent/50',
      )}
    >
      <ThreadListItemPrimitive.Trigger
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
          item.isMain ? 'font-medium' : 'font-normal text-foreground/80',
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          <ThreadListItemPrimitive.Title fallback="New chat" />
        </span>
        {working && (
          <IconLoader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        )}
      </ThreadListItemPrimitive.Trigger>
      <button
        type="button"
        aria-label="Delete conversation"
        className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md bg-sidebar text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-destructive focus-visible:opacity-100 group-hover/session:opacity-100 [&>svg]:size-3.5"
        onClick={(event) => {
          event.stopPropagation();
          requestDelete(threadId);
        }}
      >
        <IconTrash />
      </button>
    </ThreadListItemPrimitive.Root>
  );
};

const SessionList = () => {
  const isLoading = useAssistantState(({ threads }) => threads.isLoading);
  const isEmpty = useAssistantState(
    ({ threads }) => threads.threadIds.length === 0,
  );

  return (
    <ThreadListPrimitive.Root className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
      {isLoading && (
        <div className="flex flex-col gap-2 px-2 py-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      )}
      {!isLoading && isEmpty && (
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          No conversations yet
        </p>
      )}
      <ThreadListPrimitive.Items components={{ ThreadListItem: SessionListItem }} />
    </ThreadListPrimitive.Root>
  );
};

// The chat workspace sidebar: agents up top, the active agent's conversations
// below — an assistant-ui thread list driven by the remote mastra sessions.
export const AgentChatSidebar = ({
  agents,
  activeAgentId,
}: {
  agents: IChatAgent[];
  activeAgentId: string;
}) => {
  const { toast } = useToast();
  const runtime = useAssistantRuntime();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const wasMain =
        runtime.threads.getState().mainThreadId === pendingDelete;
      await runtime.threads.getItemById(pendingDelete).delete();
      setPendingDelete(null);
      // Deleting the open conversation re-homes to the most recent one (the
      // runtime parks main on a fresh draft during delete).
      const remaining = runtime.threads.getState().threads;
      if (wasMain && remaining.length > 0) {
        void runtime.threads.switchToThread(remaining[0]);
      }
    } catch (error) {
      toast({
        title: 'Failed to delete session',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, runtime, toast]);

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r bg-sidebar">
      <div className="flex flex-col gap-0.5 overflow-y-auto p-2">
        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
          Agents
        </p>
        {agents.map((agent) => (
          <AgentRow
            key={agent._id}
            agent={agent}
            isActive={agent._id === activeAgentId}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-1 border-t px-4 pt-2 pb-1">
        <p className="text-xs font-medium text-muted-foreground">
          Conversations
        </p>
        <ThreadListPrimitive.New asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="New conversation"
            title="New conversation"
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <IconPlus className="size-4" />
          </Button>
        </ThreadListPrimitive.New>
      </div>
      <SessionDeleteContext.Provider value={setPendingDelete}>
        <SessionList />
      </SessionDeleteContext.Provider>
      <DeleteSessionDialog
        loading={deleting}
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </aside>
  );
};
