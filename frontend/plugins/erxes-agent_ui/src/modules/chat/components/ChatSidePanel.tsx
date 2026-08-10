import { cn } from 'erxes-ui';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import type { IMastraThread } from '~/modules/chat/types';
import { AgentRail } from '~/modules/chat/components/AgentRail';
import { SessionList } from '~/modules/chat/components/SessionList';

// Side panel: the agent rail and chat list slide. On narrow screens it becomes
// an off-canvas drawer over the chat.
export const ChatSidePanel = ({
  asDrawer,
  sidebarOpen,
  onCloseSidebar,
  showAgentRail,
  agents,
  agentsLoading,
  agentId,
  onAgentSelect,
  hasAgent,
  threads,
  sessionsLoaded,
  isDraft,
  activeThreadId,
  hasMoreSessions,
  loadingMoreSessions,
  onLoadMore,
  onSelectSession,
  onNewThread,
  onDeleteSession,
  onRenameSession,
  onRailOpen,
  sessionsError,
  onRetrySessions,
}: {
  asDrawer: boolean;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  showAgentRail: boolean;
  agents: IChatAgent[];
  agentsLoading: boolean;
  agentId?: string;
  onAgentSelect: (id: string) => void;
  hasAgent: boolean;
  threads: IMastraThread[];
  sessionsLoaded: boolean;
  isDraft: boolean;
  activeThreadId?: string;
  hasMoreSessions?: boolean;
  loadingMoreSessions?: boolean;
  onLoadMore?: () => void;
  onSelectSession: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteSession: (
    e: React.MouseEvent | React.KeyboardEvent,
    threadId: string,
  ) => void;
  onRenameSession: (id: string, threadId: string, title: string) => void;
  onRailOpen: () => void;
  sessionsError?: boolean;
  onRetrySessions?: () => void;
}) => (
  <>
    {asDrawer && sidebarOpen && (
      <div
        className="absolute inset-0 z-30 bg-black/40"
        onClick={onCloseSidebar}
        aria-hidden
      />
    )}
    <div
      className={cn(
        'shrink-0 border-r overflow-hidden w-60',
        asDrawer
          ? 'absolute inset-y-0 left-0 z-40 shadow-xl transition-transform duration-200 ease-in-out'
          : 'relative',
        asDrawer && !sidebarOpen && '-translate-x-full',
      )}
    >
      <div
        className="absolute inset-0 transition-transform duration-200 ease-in-out"
        style={{
          transform: showAgentRail ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <AgentRail
          agents={agents}
          loading={agentsLoading}
          activeAgentId={agentId}
          onSelect={onAgentSelect}
        />
      </div>
      {hasAgent && agentId && (
        <div
          className="absolute inset-0 transition-transform duration-200 ease-in-out"
          style={{
            transform: showAgentRail ? 'translateX(100%)' : 'translateX(0)',
          }}
        >
          <SessionList
            agentId={agentId}
            sessions={threads}
            sessionsLoaded={sessionsLoaded}
            isDraft={isDraft}
            activeThreadId={activeThreadId}
            hasMore={hasMoreSessions}
            loadingMore={loadingMoreSessions}
            onLoadMore={onLoadMore}
            onSelect={onSelectSession}
            onNew={onNewThread}
            onDelete={onDeleteSession}
            onRename={onRenameSession}
            onBack={onRailOpen}
            hasError={sessionsError}
            onRetry={onRetrySessions}
          />
        </div>
      )}
    </div>
  </>
);
