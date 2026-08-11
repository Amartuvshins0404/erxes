import {
  Breadcrumb,
  Button,
  PageContainer,
  ScrollArea,
  Separator,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { IconListDetails } from '@tabler/icons-react';
import { PageHeader } from 'ui-modules';
import { AdminListingDetailProfile } from '@/agencies/listing/components/AdminListingDetailProfile';
import { AdminListingDetailSidebar } from '@/agencies/listing/components/AdminListingDetailSidebar';
import { AdminListingDetailTabs } from '@/agencies/listing/components/AdminListingDetailTabs';
import { useAdminListingDetail } from '@/agencies/listing/hooks/useAdminListingDetail';

const ListingDetailBreadcrumb = () => {
  const { listing } = useAdminListingDetail();
  return (
    <Breadcrumb>
      <Breadcrumb.List className="gap-1">
        <Breadcrumb.Item>
          <Button variant="ghost" asChild>
            <Link to="/blockadmin/agencies/listing">
              <IconListDetails className="text-accent-foreground" />
              Listing
            </Link>
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        {listing?.title && (
          <Breadcrumb.Item>
            <Button variant="ghost">
              <Breadcrumb.Page>{listing.title}</Breadcrumb.Page>
            </Button>
          </Breadcrumb.Item>
        )}
      </Breadcrumb.List>
    </Breadcrumb>
  );
};

export const AdminListingDetailPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <ListingDetailBreadcrumb />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <div className="flex flex-col flex-auto overflow-hidden">
        <AdminListingDetailProfile />
        <div className="flex flex-auto overflow-hidden">
          <AdminListingDetailSidebar />
          <ScrollArea className="flex-auto bg-sidebar">
            <AdminListingDetailTabs />
            <ScrollArea.Bar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </PageContainer>
  );
};
