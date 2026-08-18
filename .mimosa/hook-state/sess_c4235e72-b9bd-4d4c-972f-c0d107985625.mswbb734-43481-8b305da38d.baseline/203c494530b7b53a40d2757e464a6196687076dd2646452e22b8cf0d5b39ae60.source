import { IconUsersGroup } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { Link } from 'react-router-dom';
import { CollectiveProfileForm } from '@/collective/components/CollectiveProfileForm';

export const IndexPage = () => {
  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/supplier/profile">
                    <IconUsersGroup />
                    Collective
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <div className="flex h-full overflow-auto">
        <div className="flex flex-col flex-auto h-full overflow-auto">
          <CollectiveProfileForm />
        </div>
      </div>
    </div>
  );
};
