import { IconContract } from '@tabler/icons-react';
import { Breadcrumb, Button, PageSubHeader } from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { AddOpptySheet } from './AddOpptySheet';
import { OpptysFilter } from './OpptysFilter';
import { OpptysViewControl } from './OpptysView';

export const OpptysLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <OpptysHeader />
      <div className="flex overflow-hidden w-full h-full">
        <div className="flex flex-col overflow-hidden w-full h-full">
          <PageSubHeader>
            <OpptysFilter />
            <OpptysViewControl />
          </PageSubHeader>
          {children}
        </div>
      </div>
    </>
  );
};

export const OpptysHeader = () => {
  const { projectId } = useParams();

  if (!projectId) return null;

  return (
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={`/block/project/${projectId}/opportunities`}>
                  <IconContract />
                  Opportunities
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
      </PageHeader.Start>
      <PageHeader.End>
        <AddOpptySheet />
      </PageHeader.End>
    </PageHeader>
  );
};
