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
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
import { Button, cn, Separator, Skeleton, useToast } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
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

// One row geometry shared by agent rows and conversation rows — full-width
// h-10 click target, same padding and type, so both halves of the sidebar
// read as one design. Hovers stay on host-guaranteed utilities / ea-* classes.
const sideRow =
  'flex h-10 w-full items-center justify-start gap-2 rounded-md px-3 text-left text-sm transition-colors';

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
        sideRow,
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent',
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
        'group/session relative w-full rounded-md transition-colors',
        item.isMain ? 'ea-side-active' : 'hover:bg-accent',
      )}
    >
      <ThreadListItemPrimitive.Trigger
        className={cn(
          sideRow,
          item.isMain ? 'font-medium' : 'font-normal text-muted-foreground',
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
        className="ea-icon-btn ea-reveal ea-center-y absolute right-1 flex size-5 items-center justify-center rounded-md bg-sidebar text-muted-foreground hover:bg-accent hover:text-destructive"
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
    <ThreadListPrimitive.Root className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto pb-2">
      {isLoading && (
        <div className="flex flex-col gap-2 px-3 py-1.5">
          <Skeleton className="h-3.5 ea-w-3-4" />
          <Skeleton className="h-3.5 ea-w-2-3" />
          <Skeleton className="h-3.5 ea-w-3-4" />
        </div>
      )}
      {!isLoading && isEmpty && (
        <p className="px-3 py-1.5 text-xs text-muted-foreground">
          No conversations yet
        </p>
      )}
      <ThreadListPrimitive.Items components={{ ThreadListItem: SessionListItem }} />
    </ThreadListPrimitive.Root>
  );
};

// The chat workspace sidebar: agents and the active agent's conversations
// split the height 50/50 — each half has its own header and scroll region.
// The conversation list is an assistant-ui thread list driven by the remote
// mastra sessions.
export const AgentChatSidebar = ({
  agents,
  activeAgentId,
}: {
  agents: IChatAgent[];
  activeAgentId: string;
}) => {
  const { toast } = useToast();
  const { hasActionPermission } = usePermissionCheck();
  const runtime = useAssistantRuntime();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const wasMain =
        runtime.threads.getState().mainThreadId === pendingDelete;
      const item = runtime.threads.getItemById(pendingDelete);
      // assistant-ui 0.11's remote-thread-list delete() drops the thread from
      // the list lookup but never stops its mounted per-thread provider (only
      // detach() does), so the provider's next state read throws
      // "tapLookupResources: Resource not found" and the plugin error
      // boundary fires. Detach first — this also re-homes main onto a fresh
      // draft — then give React a macrotask to commit the unmount before the
      // thread leaves the lookup (detach's promise is not publicly returned).
      item.detach();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await item.delete();
      setPendingDelete(null);
      // Deleting the open conversation re-homes to the most recent one (the
      // detach above already parked main on a fresh draft).
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
      {/* Agents — one half of the split. */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center px-3 pt-2 pb-1">
          <p className="text-xs font-medium text-muted-foreground">Agents</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto pb-2">
          {agents.map((agent) => (
            <AgentRow
              key={agent._id}
              agent={agent}
              isActive={agent._id === activeAgentId}
            />
          ))}
        </div>
      </div>
      <Separator />
      {/* Conversations of the active agent — the other half. */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-1 px-3 pt-2 pb-1">
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
      </div>
      {hasActionPermission(ERXES_AGENT_ACTIONS.agent.readSummary) && (
        <div className="shrink-0 border-t border-border p-2">
          <Link
            to="/erxes-agent/agents"
            className={cn(sideRow, 'text-muted-foreground hover:bg-accent')}
          >
            <IconSettings className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">Manage agents</span>
          </Link>
        </div>
      )}
      <DeleteSessionDialog
        loading={deleting}
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </aside>
  );
};
