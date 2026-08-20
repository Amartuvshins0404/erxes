import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader, createFavoriteBreadcrumb } from 'ui-modules';
import { IconHomeSearch } from '@tabler/icons-react';
import { Outlet } from 'react-router';
import { CreateListing } from '~/modules/listing/components/CreateListing';

export const ListingPage = () => {
  const favoriteBreadcrumb = createFavoriteBreadcrumb('Listing');

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost">
                  <IconHomeSearch />
                  Listing
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={favoriteBreadcrumb}
            icon="IconHomeSearch"
          />
        </PageHeader.Start>
        <PageHeader.End>
          <CreateListing />
        </PageHeader.End>
      </PageHeader>
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden flex-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
