import { useParams } from 'react-router-dom';
import { IconChevronLeft, IconLibrary } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { AgentTemplateDetail } from '~/modules/agent-templates/AgentTemplateDetail';

export const AgentTemplateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const assistantId = searchParams.get('assistantId');
  const backTo = assistantId ? `/agent/assistant/${assistantId}` : '/agent/assistant';
  const templatesTo = `/agent/templates${assistantId ? `?assistantId=${assistantId}` : ''}`;

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
                  <Link to={templatesTo}>
                    <IconLibrary />
                    AI Assistant Templates
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>Detail</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      {id && <AgentTemplateDetail agentId={id} />}
    </div>
  );
};
