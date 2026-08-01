import {
  IconFiles,
  IconLayoutSidebar,
  IconMessageCircle,
  IconPlus,
  IconSparkles,
} from '@tabler/icons-react';
import { Breadcrumb, Button } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import type { ChatMode } from '~/modules/chat/lib/chatMode';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { AgentFavoriteToggle } from '~/modules/navigation/components/AgentFavoriteToggle';

// Chat page top bar: breadcrumb + (when an agent is picked and in chat mode) the
// Files / Make skill / New chat actions.
export const ChatPageHeader = ({
  hasAgent,
  agentName,
  agentId,
  asDrawer,
  onToggleSidebar,
  chatMode,
  activeThreadId,
  isDraft,
  onMakeSkill,
  making,
  chatLoading,
  onNewThread,
}: {
  hasAgent: boolean;
  agentName?: string;
  agentId?: string;
  asDrawer: boolean;
  onToggleSidebar: () => void;
  chatMode: ChatMode;
  activeThreadId?: string;
  isDraft: boolean;
  onMakeSkill: () => void;
  making: boolean;
  chatLoading: boolean;
  onNewThread: () => void;
}) => {
  return (
    <PageHeader>
      <PageHeader.Start>
        {asDrawer && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label="Toggle sessions"
          >
            <IconLayoutSidebar className="size-4" />
          </Button>
        )}
        <Breadcrumb>
          <Breadcrumb.List className="gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" size="sm">
                <IconMessageCircle />
                Chat
              </Button>
            </Breadcrumb.Item>
            {hasAgent && (
              <>
                <Breadcrumb.Separator />
                <Breadcrumb.Item>
                  <span className="text-muted-foreground text-sm">
                    {agentName}
                  </span>
                </Breadcrumb.Item>
              </>
            )}
          </Breadcrumb.List>
        </Breadcrumb>
        {hasAgent && agentId && <AgentFavoriteToggle agentId={agentId} />}
      </PageHeader.Start>
      {hasAgent && chatMode === 'chat' && (
        <PageHeader.End>
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewStore.getState().openList()}
          >
            <IconFiles className="size-3.5" />
            <span className="hidden sm:inline">Files</span>
          </Button>
          {activeThreadId && !isDraft && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMakeSkill}
              disabled={making || chatLoading}
            >
              <IconSparkles className="size-3.5" />
              <span className="hidden sm:inline">
                {making ? 'Distilling…' : 'Make skill'}
              </span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onNewThread}>
            <IconPlus className="size-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </Button>
        </PageHeader.End>
      )}
    </PageHeader>
  );
};
