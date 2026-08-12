import { IconFiles, IconMessageCircle, IconPlus } from '@tabler/icons-react';
import { Breadcrumb, Button } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { AgentFavoriteToggle } from '~/modules/navigation/components/AgentFavoriteToggle';

// Chat page top bar: breadcrumb plus file and new-chat actions.
export const ChatPageHeader = ({
  hasAgent,
  agentName,
  agentId,
  onNewThread,
}: {
  hasAgent: boolean;
  agentName?: string;
  agentId?: string;
  onNewThread: () => void;
}) => {
  return (
    <PageHeader>
      <PageHeader.Start>
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
