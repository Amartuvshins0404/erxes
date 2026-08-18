import { IconPackage } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { Link } from 'react-router-dom';
import { CollectivePackageAddSheet } from '@/collective/components/CollectivePackageAddSheet';
import { CollectivePackageDetailSheet } from '@/collective/components/CollectivePackageDetailSheet';
import { CollectivePackagesList } from '@/collective/components/CollectivePackagesList';

export const PackagesPage = () => {
  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/supplier/packages">
                    <IconPackage />
                    Packages
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <CollectivePackageAddSheet />
        </PageHeader.End>
      </PageHeader>
      <div className="flex-auto overflow-auto">
        <CollectivePackagesList />
      </div>
      <CollectivePackageDetailSheet />
    </div>
  );
};
