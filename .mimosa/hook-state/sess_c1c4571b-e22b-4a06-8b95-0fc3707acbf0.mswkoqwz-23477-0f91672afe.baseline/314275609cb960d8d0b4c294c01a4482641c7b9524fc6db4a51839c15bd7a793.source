import { IconFileText } from '@tabler/icons-react';
import { Breadcrumb, Button, PageSubHeader } from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { OffersFilter } from './OffersFilter';
import { OfferAddSheet } from './OfferAdd';

export const OffersLayout = ({ children }: { children: React.ReactNode }) => {
  const { projectId } = useParams();

  return (
    <>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/block/project/${projectId}/offers`}>
                    <IconFileText />
                    Offers
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <OfferAddSheet />
        </PageHeader.End>
      </PageHeader>
      <div className="flex overflow-hidden w-full h-full">
        <div className="flex flex-col overflow-hidden w-full h-full">
          <PageSubHeader>
            <OffersFilter />
          </PageSubHeader>
          {children}
        </div>
      </div>
    </>
  );
};
