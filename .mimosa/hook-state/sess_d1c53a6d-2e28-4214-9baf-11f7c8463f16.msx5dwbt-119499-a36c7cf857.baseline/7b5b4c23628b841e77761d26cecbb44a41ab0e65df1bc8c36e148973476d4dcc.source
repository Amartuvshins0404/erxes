import { IconChevronLeft, IconLibrary } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { AgentTemplatesList } from '~/modules/agent-templates/AgentTemplatesList';

export const AgentTemplatesIndexPage = () => {
  const [searchParams] = useSearchParams();
  const assistantId = searchParams.get('assistantId');
  const backTo = assistantId ? `/agent/assistant/${assistantId}` : '/agent/assistant';

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Button variant="ghost" asChild>
            <Link to={backTo}>
              <IconChevronLeft />
              Back
            </Link>
          </Button>
          <Separator.Inline />
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/agent/templates${assistantId ? `?assistantId=${assistantId}` : ''}`}>
                    <IconLibrary />
                    AI Assistant Templates
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      <AgentTemplatesList />
    </div>
  );
};
