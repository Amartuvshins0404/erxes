import {
  IconFiles,
  IconLayoutSidebar,
  IconMessageCircle,
  IconPlus,
} from '@tabler/icons-react';
import { Breadcrumb, Button } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { AgentFavoriteToggle } from '~/modules/navigation/components/AgentFavoriteToggle';

// Chat page top bar: breadcrumb plus file and new-chat actions.
export const ChatPageHeader = ({
  hasAgent,
  agentName,
  agentId,
  asDrawer,
  onToggleSidebar,
  onNewThread,
}: {
  hasAgent: boolean;
  agentName?: string;
  agentId?: string;
  asDrawer: boolean;
  onToggleSidebar: () => void;
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
      {hasAgent && (
        <PageHeader.End>
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewStore.getState().openList()}
          >
            <IconFiles className="size-3.5" />
            <span className="hidden sm:inline">Files</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onNewThread}>
            <IconPlus className="size-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </Button>
        </PageHeader.End>
      )}
    </PageHeader>
  );
};
