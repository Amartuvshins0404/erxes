import { PageContainer, PageSubHeader, ScrollArea, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';

import { AdminProfileBreadcrumb } from '@/profile/components/AdminProfileBreadcrumb';
import { AdminProfileFilter } from '@/profile/components/AdminProfileFilter';
import { AdminProfileGrid } from '@/profile/components/AdminProfileGrid';

export const IndexPage = () => (
  <PageContainer>
    <PageHeader>
      <PageHeader.Start>
        <AdminProfileBreadcrumb />
        <Separator.Inline />
        <PageHeader.FavoriteToggleButton
          breadcrumb={['Улс төрчид']}
          icon="IconShieldCheck"
        />
      </PageHeader.Start>
    </PageHeader>
    <PageSubHeader>
      <AdminProfileFilter />
    </PageSubHeader>
    <ScrollArea className="flex-auto">
      <AdminProfileGrid />
    </ScrollArea>
  </PageContainer>
);
