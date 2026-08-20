import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader, createFavoriteBreadcrumb } from 'ui-modules';
import { IconBuildingEstate } from '@tabler/icons-react';
import { Outlet } from 'react-router';

export const UnitPage = () => {
  const favoriteBreadcrumb = createFavoriteBreadcrumb('Units');

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost">
                  <IconBuildingEstate />
                  Units
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={favoriteBreadcrumb}
            icon="IconBuildingEstate"
          />
        </PageHeader.Start>
      </PageHeader>
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden flex-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
