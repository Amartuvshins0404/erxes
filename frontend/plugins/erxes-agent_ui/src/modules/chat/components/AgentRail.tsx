import { useState } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { Button, ErxesLogoIcon, Skeleton, Tooltip } from 'erxes-ui';
import { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import {
  useAgentActivity,
  useAgentUnread,
  useAgentWorking,
} from '~/modules/chat/hooks/useChatView';
import { EditAgentDialog } from '~/modules/chat/components/EditAgentDialog';

// One agent row — subscribes to its own working/unread/activity slices so a
// streaming reply only re-renders that row, not the whole rail.
const AgentRailItem = ({
  agent,
  isActive,
  onSelect,
  onEdit,
}: {
  agent: IChatAgent;
  isActive: boolean;
  onSelect: (agentId: string) => void;
  onEdit: (agent: IChatAgent) => void;
}) => {
  const isWorking = useAgentWorking(agent._id);
  const hasUnread = useAgentUnread(agent._id) && !isActive;
  const activity = useAgentActivity(agent._id);
  const showActivity = isWorking ? activity : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group relative w-full cursor-pointer rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent ${
        isActive || isWorking ? 'bg-accent' : ''
      }`}
      onClick={() => onSelect(agent._id)}
      onKeyDown={(e) => {
        // Only act on the row's own keys — ignore Enter/Space that bubbled up
        // from the focused gear button (which has its own handler).
        if (
          (e.key === 'Enter' || e.key === ' ') &&
          e.target === e.currentTarget
        ) {
          e.preventDefault();
          onSelect(agent._id);
        }
      }}
    >
      {/* Quick-edit affordance — appears on hover/focus, opens the in-chat
          settings modal without leaving the conversation. */}
      <Tooltip.Provider>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Edit ${agent.name} settings`}
              className="absolute right-1 top-1 z-10 size-6 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(agent);
              }}
            >
              <IconSettings className="size-3.5" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Edit agent settings</Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>

      {/* No icon — the name carries the row. pr-7 keeps text clear of the
          hover gear. An unread dot sits inline before the name. */}
      <div className="min-w-0 pr-7">
        <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
          {hasUnread && (
            <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
          )}
          <span className="truncate">{agent.name}</span>
        </p>
        {/* While working, the model line gives way to the live step — one
            shimmering line — so the row stays the same height. */}
        {showActivity ? (
          <p className="mt-0.5 truncate text-xs">
            <span className="ea-shimmer-text">{showActivity}</span>
          </p>
        ) : (
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
            {agent.model}
          </p>
        )}
      </div>
    </div>
  );
};

export const AgentRail = ({
  agents,
  loading,
  activeAgentId,
  onSelect,
}: {
  agents: IChatAgent[];
  loading: boolean;
  activeAgentId?: string;
  onSelect: (agentId: string) => void;
}) => {
  // A single editor for the whole rail — opened with the row's agent, mounted
  // only while open so its form/mutation/subscriptions don't exist per row.
  const [editingAgent, setEditingAgent] = useState<IChatAgent | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Agents
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="p-4 text-center">
            <ErxesLogoIcon className="h-7 w-auto text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No enabled agents.</p>
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {agents.map((agent) => (
              <AgentRailItem
                key={agent._id}
                agent={agent}
                isActive={activeAgentId === agent._id}
                onSelect={onSelect}
                onEdit={setEditingAgent}
              />
            ))}
          </div>
        )}
      </div>

      {editingAgent && (
        <EditAgentDialog
          agent={editingAgent}
          open
          onOpenChange={(next) => {
            if (!next) setEditingAgent(null);
          }}
        />
      )}
    </div>
  );
};
