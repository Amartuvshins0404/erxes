import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import {
  IconLoader2,
  IconPlus,
  IconRobot,
  IconTrash,
} from '@tabler/icons-react';
import {
  AlertDialog,
  Collapsible,
  NavigationMenuGroup,
  NavigationMenuLinkItem,
  Sidebar,
} from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import { chatStore } from '~/modules/chat/store/chatStore';
import {
  useAgentUnread,
  useAgentWorking,
  useHasAnyActivity,
} from '~/modules/chat/hooks/useChatView';
import { useChatAgents, type IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { useMastraThreads } from '~/modules/chat/hooks/useMastraThreads';
import { useRemoveMastraThread } from '~/modules/chat/hooks/useRemoveMastraThread';
import { AgentAvatar } from '~/modules/chat/components/Avatars';

// Session row: deep-link to the conversation; delete on hover with a confirm.
const SessionNavRow = ({
  agent,
  thread,
  active,
  onDelete,
}: {
  agent: IChatAgent;
  thread: { _id: string; threadId: string; title: string };
  active: boolean;
  onDelete: (threadId: string) => void;
}) => (
  <Sidebar.SubItem className="group/session-row">
    <Sidebar.SubButton asChild isActive={active}>
      <Link to={`/erxes-agent/chat/${agent._id}?thread=${thread.threadId}`}>
        <span className="truncate">
          {thread.title || 'Untitled conversation'}
        </span>
        <button
          type="button"
          aria-label="Delete conversation"
          className="ml-auto invisible group-hover/session-row:visible text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(thread.threadId);
          }}
        >
          <IconTrash className="size-3.5" />
        </button>
      </Link>
    </Sidebar.SubButton>
  </Sidebar.SubItem>
);

// Lazy per-agent session list — only queried/rendered once the row expands.
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
    return (
      <Sidebar.SubItem>
        <span className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
          <IconLoader2 className="size-3 animate-spin" /> Loading…
        </span>
      </Sidebar.SubItem>
    );
  }
  return (
    <>
      {threads.map((thread) => (
        <SessionNavRow
          key={thread.threadId}
          agent={agent}
          thread={thread}
          active={onAgentPath && activeThread === thread.threadId}
          onDelete={onDelete}
        />
      ))}
      {threads.length === 0 && (
        <Sidebar.SubItem>
          <span className="px-2 py-1 text-xs text-muted-foreground">
            No conversations yet
          </span>
        </Sidebar.SubItem>
      )}
    </>
  );
};

// One agent row in the Chat tree: expand to browse its sessions, + starts a
// fresh conversation with it. Working/unread badges mirror the chat rail.
const AgentNavRow = ({
  agent,
  onDeleteSession,
}: {
  agent: IChatAgent;
  onDeleteSession: (agentId: string, threadId: string) => void;
}) => {
  const apolloClient = useApolloClient();
  const working = useAgentWorking(agent._id);
  const unread = useAgentUnread(agent._id);
  const [open, setOpen] = useState(false);

  const newThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    chatStore.newDraft(apolloClient, agent._id, agent._id);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Sidebar.MenuItem>
        <Collapsible.Trigger asChild>
          <Sidebar.MenuButton className="group/agent-row">
            <Link to={`/erxes-agent/chat/${agent._id}`}>
              <AgentAvatar />
              <span className="truncate">{agent.accountName}</span>
              {working && (
                <IconLoader2 className="size-3.5 animate-spin text-primary shrink-0" />
              )}
              {unread && !working && (
                <span className="size-2 rounded-full bg-red-500 shrink-0" />
              )}
              <span
                role="button"
                aria-label="New conversation"
                className="ml-auto invisible group-hover/agent-row:visible text-muted-foreground hover:text-foreground"
                onClick={newThread}
              >
                <IconPlus className="size-4" />
              </span>
            </Link>
          </Sidebar.MenuButton>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Sidebar.Sub>
            {open && (
              <AgentSessions
                agent={agent}
                onDelete={(threadId) => onDeleteSession(agent._id, threadId)}
              />
            )}
          </Sidebar.Sub>
        </Collapsible.Content>
      </Sidebar.MenuItem>
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
        {loading && (
          <Sidebar.MenuItem>
            <span className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <IconLoader2 className="size-3 animate-spin" /> Loading…
            </span>
          </Sidebar.MenuItem>
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
        {!loading && agents.length === 0 && (
          <Sidebar.MenuItem>
            <span className="px-2 py-1 text-xs text-muted-foreground">
              No agents yet
            </span>
          </Sidebar.MenuItem>
        )}
      </NavigationMenuGroup>
      {hasActionPermission(ERXES_AGENT_ACTIONS.agent.readSummary) && (
        <NavigationMenuLinkItem
          name="Agents"
          icon={IconRobot}
          path="erxes-agent/agents"
        />
      )}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
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
