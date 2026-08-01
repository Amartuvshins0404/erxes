import { memo, useMemo, useState } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { Badge, Button, cn, ErxesLogoIcon, Skeleton, Tooltip } from 'erxes-ui';
import { currentUserState } from 'ui-modules';
import { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import {
  useAgentActivity,
  useAgentUnread,
  useAgentWorking,
} from '~/modules/chat/hooks/useChatView';
import { EditAgentDialog } from '~/modules/chat/components/EditAgentDialog';
import { duplicatedAgentNames } from '~/pages/agents/utils';
import {
  AgentVisibilityBadge,
  AgentVisibilitySection,
  getAgentVisibilityBadges,
  groupAgentsByVisibility,
} from '~/modules/chat/components/AgentRail.visibility';

const VISIBILITY_SECTION_ORDER: AgentVisibilitySection[] = [
  'mine',
  'shared',
  'organization',
  'private',
];

const VISIBILITY_SECTION_KEYS: Record<AgentVisibilitySection, string> = {
  mine: 'agent-rail-section-mine',
  shared: 'agent-rail-section-shared',
  organization: 'agent-rail-section-everyone',
  private: 'agent-rail-section-private',
};

const VISIBILITY_BADGE_KEYS: Record<AgentVisibilityBadge, string> = {
  'only-me': 'agent-rail-visibility-only-me',
  direct: 'agent-rail-visibility-direct',
  team: 'agent-rail-visibility-team',
  department: 'agent-rail-visibility-department',
  everyone: 'agent-rail-visibility-everyone',
  private: 'agent-rail-visibility-private',
  shared: 'agent-rail-visibility-shared',
};

// One agent row — subscribes to its own working/unread/activity slices so a
// streaming reply only re-renders that row, not the whole rail.
const AgentRailItem = memo(
  ({
    agent,
    currentUserId,
    isActive,
    isNameDuplicated,
    onSelect,
    onEdit,
  }: {
    agent: IChatAgent;
    currentUserId?: string;
    isActive: boolean;
    isNameDuplicated: boolean;
    onSelect: (agentId: string) => void;
    onEdit: (agent: IChatAgent) => void;
  }) => {
    const isWorking = useAgentWorking(agent._id);
    const hasUnread = useAgentUnread(agent._id) && !isActive;
    const activity = useAgentActivity(agent._id);
    const showActivity = isWorking ? activity : undefined;
    const { t } = useTranslation('erxes-agent');
    const visibilityBadges = getAgentVisibilityBadges(agent, currentUserId);

    return (
      <div
        className={cn(
          'group relative rounded-md transition-colors hover:bg-accent',
          (isActive || isWorking) && 'bg-accent',
        )}
      >
        {/* The whole row is one real button — native Enter/Space activation, no
          role/keydown shim. The gear is a sibling (not nested) so it stays a
          valid, independently focusable control. */}
        <button
          type="button"
          className="w-full cursor-pointer rounded-md px-2.5 py-2 text-left"
          onClick={() => onSelect(agent._id)}
        >
          {/* No icon — the name carries the row. pr-7 keeps text clear of the
            hover gear. An unread dot sits inline before the name. */}
          <div className="min-w-0 pr-7">
            <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
              {hasUnread && (
                <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
              )}
              <span className="truncate">{agent.accountName}</span>
              {isNameDuplicated && (
                <span className="shrink-0 font-mono text-[10px] font-normal text-muted-foreground">
                  {agent._id.slice(-6)}
                </span>
              )}
            </p>
            {/* While working, the model line gives way to the live step. */}
            {showActivity ? (
              <p className="mt-0.5 truncate text-xs">
                <span className="ea-shimmer-text">{showActivity}</span>
              </p>
            ) : (
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {agent.model}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
              {visibilityBadges.map((badge) => (
                <Badge
                  key={badge}
                  variant={badge === 'everyone' ? 'default' : 'secondary'}
                  className="h-4 rounded-sm px-1 text-[10px] font-medium leading-none"
                >
                  {t(VISIBILITY_BADGE_KEYS[badge])}
                </Badge>
              ))}
            </div>
          </div>
        </button>

        {/* Quick-edit affordance — appears on hover/focus, opens the in-chat
          settings modal without leaving the conversation. */}
        <Tooltip.Provider>
          <Tooltip>
            <Tooltip.Trigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t('agent-rail-edit-settings-aria', {
                  name: agent.accountName,
                })}
                className="absolute right-1 top-1 z-10 size-6 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                onClick={() => onEdit(agent)}
              >
                <IconSettings className="size-3.5" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>{t('agent-rail-edit-settings')}</Tooltip.Content>
          </Tooltip>
        </Tooltip.Provider>
      </div>
    );
  },
);
AgentRailItem.displayName = 'AgentRailItem';

export const AgentRail = memo(
  ({
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
    const { t } = useTranslation('erxes-agent');
    const currentUserId = useAtomValue(currentUserState)?._id;

    // Names are not unique; show an account-id suffix only for collisions.
    const duplicatedNames = useMemo(
      () => duplicatedAgentNames(agents.map((agent) => agent.accountName)),
      [agents],
    );
    const groupedAgents = useMemo(
      () => groupAgentsByVisibility(agents, currentUserId),
      [agents, currentUserId],
    );

    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2.5 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('agent-rail-title')}
          </p>
        </div>
        <div className="ea-scroll flex-1 overflow-auto">
          {loading ? (
            <div className="p-3 space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="p-4 text-center">
              <ErxesLogoIcon className="h-7 w-auto text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('agent-rail-empty')}
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-1.5">
              {VISIBILITY_SECTION_ORDER.map((section) => {
                const sectionAgents = groupedAgents[section];
                if (!sectionAgents.length) return null;

                return (
                  <section
                    key={section}
                    aria-label={t(VISIBILITY_SECTION_KEYS[section])}
                  >
                    <h3 className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(VISIBILITY_SECTION_KEYS[section])}
                      <span className="font-mono text-[10px] font-normal">
                        {sectionAgents.length}
                      </span>
                    </h3>
                    <div className="space-y-0.5">
                      {sectionAgents.map((agent) => (
                        <AgentRailItem
                          key={agent._id}
                          agent={agent}
                          currentUserId={currentUserId}
                          isActive={activeAgentId === agent._id}
                          isNameDuplicated={duplicatedNames.has(
                            agent.accountName,
                          )}
                          onSelect={onSelect}
                          onEdit={setEditingAgent}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
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
  },
);
AgentRail.displayName = 'AgentRail';
