import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import {
  IconCaretRightFilled,
  IconLoader2,
  IconPlus,
  IconRobot,
  IconTrash,
} from '@tabler/icons-react';
import {
  AlertDialog,
  Button,
  Collapsible,
  NavigationMenuGroup,
  NavigationMenuLinkItem,
  Sidebar,
  Skeleton,
} from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import { chatStore } from '~/modules/chat/store/chatStore';
import {
  useAgentUnread,
  useAgentWorking,
  useHasAnyActivity,
} from '~/modules/chat/hooks/useChatView';
import {
  useChatAgents,
  type IChatAgent,
} from '~/modules/chat/hooks/useChatAgents';
import { useMastraThreads } from '~/modules/chat/hooks/useMastraThreads';
import { useRemoveMastraThread } from '~/modules/chat/hooks/useRemoveMastraThread';

// Per-agent session list — skipped entirely while the row is collapsed.
const AgentSessions = ({
  agent,
  onDelete,
}: {
  agent: IChatAgent;
  onDelete: (threadId: string) => void;
}) => {
  const { threads, loading } = useMastraThreads(agent._id);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const activeThread = searchParams.get('thread');
  const onAgentPath = pathname === `/erxes-agent/chat/${agent._id}`;

  if (loading) {
    return <Skeleton className="w-28 h-4 ml-8 my-1" />;
  }
  if (threads.length === 0) {
    return (
      <div className="text-sm text-muted-foreground ml-8 my-2">
        No conversations yet
      </div>
    );
  }
  return (
    <>
      {threads.map((thread) => (
        <NavigationMenuLinkItem
          key={thread.threadId}
          name={thread.title || 'Untitled conversation'}
          path={`erxes-agent/chat/${agent._id}?thread=${thread.threadId}`}
          isActive={onAgentPath && activeThread === thread.threadId}
          action={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete conversation"
              className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete(thread.threadId);
              }}
            >
              <IconTrash className="size-3.5" />
            </Button>
          }
        />
      ))}
    </>
  );
};

// One agent row: click opens its chat, the caret expands its sessions (lazy),
// + starts a fresh conversation. Working/unread badges mirror the chat rail.
const AgentNavRow = ({
  agent,
  onDeleteSession,
}: {
  agent: IChatAgent;
  onDeleteSession: (agentId: string, threadId: string) => void;
}) => {
  const apolloClient = useApolloClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const working = useAgentWorking(agent._id);
  const unread = useAgentUnread(agent._id);
  const isActive = pathname.startsWith(`/erxes-agent/chat/${agent._id}`);
  const [open, setOpen] = useState(false);

  const newThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    chatStore.newDraft(apolloClient, agent._id, agent._id);
    navigate(`/erxes-agent/chat/${agent._id}`);
  };

  return (
    <Collapsible className="group/agent" open={open} onOpenChange={setOpen}>
      <div className="flex items-center w-full">
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className="justify-start gap-2 overflow-hidden text-left flex-auto min-w-0 py-1.5 px-2 h-auto font-normal"
          onClick={() => {
            navigate(`/erxes-agent/chat/${agent._id}`);
            if (!isActive) setOpen(true);
          }}
        >
          <IconRobot className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 min-w-0 truncate">{agent.accountName}</span>
          {working && (
            <IconLoader2 className="size-3.5 shrink-0 animate-spin text-primary" />
          )}
          {unread && !working && (
            <span className="size-2 shrink-0 rounded-full bg-red-500" />
          )}
          <span
            role="button"
            aria-label="New conversation"
            className="shrink-0 invisible group-hover/agent:visible text-muted-foreground hover:text-foreground"
            onClick={newThread}
          >
            <IconPlus className="size-4" />
          </span>
        </Button>
        <Collapsible.Trigger asChild>
          <Button
            variant="ghost"
            className="shrink-0 size-6 p-0"
            aria-label={`Conversations with ${agent.accountName}`}
            aria-expanded={open}
          >
            <IconCaretRightFilled className="size-3 transition-transform group-data-[state=open]/agent:rotate-90 text-muted-foreground" />
          </Button>
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content>
        <Sidebar.Menu>
          {open && (
            <AgentSessions
              agent={agent}
              onDelete={(threadId) => onDeleteSession(agent._id, threadId)}
            />
          )}
        </Sidebar.Menu>
      </Collapsible.Content>
    </Collapsible>
  );
};

// The module's nested navigation: "Chat" opens the agent tree (each agent
// lazy-expands to its sessions); "Agents" stays the flat manage link.
export const AgentChatNavTree = () => {
  const { hasActionPermission } = usePermissionCheck();
  const { agents, loading } = useChatAgents();
  const hasAnyUnread = useHasAnyActivity();
  const [pendingDelete, setPendingDelete] = useState<{
    agentId: string;
    threadId: string;
  } | null>(null);
  const { removeThread, loading: deleteLoading } = useRemoveMastraThread(
    pendingDelete?.agentId,
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const result = await removeThread(pendingDelete.threadId).catch(() => null);
    if (result?.data?.mastraThreadRemove) {
      chatStore.discardThread(pendingDelete.agentId, pendingDelete.threadId);
    }
    setPendingDelete(null);
  };

  if (!hasActionPermission(ERXES_AGENT_ACTIONS.agent.chat)) return null;

  return (
    <>
      <NavigationMenuGroup
        name="Chat"
        actions={
          hasAnyUnread ? (
            <span className="size-2 rounded-full bg-red-500" />
          ) : undefined
        }
      >
        {loading && <Skeleton className="w-28 h-4 ml-2 my-1" />}
        {!loading && agents.length === 0 && (
          <div className="text-sm text-muted-foreground px-2 my-1">
            No agents yet
          </div>
        )}
        {agents.map((agent) => (
          <AgentNavRow
            key={agent._id}
            agent={agent}
            onDeleteSession={(agentId, threadId) =>
              setPendingDelete({ agentId, threadId })
            }
          />
        ))}
      </NavigationMenuGroup>
      {hasActionPermission(ERXES_AGENT_ACTIONS.agent.readSummary) && (
        <NavigationMenuLinkItem
          name="Agents"
          icon={IconRobot}
          path="erxes-agent/agents"
        />
      )}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete conversation?</AlertDialog.Title>
            <AlertDialog.Description>
              This permanently removes the conversation and its messages.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={deleteLoading}>
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};
