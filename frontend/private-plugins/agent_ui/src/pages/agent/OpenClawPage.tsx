import { IconSparkles } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { useIdentifier } from '~/modules/assistant-orgs/hooks/useAssistantOrg';
import { AgentMain } from '~/modules/main/AgentMain';

export const OpenClawIndexPage = () => {
  const { identifier } = useIdentifier();

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/agent/assistant">
                    <IconSparkles />
                    AI Assistant
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>{identifier?.name || 'Server'}</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      <AgentMain />
    </div>
  );
};
