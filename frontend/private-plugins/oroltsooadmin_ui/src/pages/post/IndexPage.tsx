import { PageContainer, PageSubHeader, ScrollArea, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';

import { AdminPostBreadcrumb } from '@/post/components/AdminPostBreadcrumb';
import { AdminPostFilter } from '@/post/components/AdminPostFilter';
import { AdminPostGrid } from '@/post/components/AdminPostGrid';

export const IndexPage = () => (
  <PageContainer>
    <PageHeader>
      <PageHeader.Start>
        <AdminPostBreadcrumb />
        <Separator.Inline />
        <PageHeader.FavoriteToggleButton
          breadcrumb={['Постууд']}
          icon="IconWriting"
        />
      </PageHeader.Start>
    </PageHeader>
    <PageSubHeader>
      <AdminPostFilter />
    </PageSubHeader>
    <ScrollArea className="flex-auto">
      <AdminPostGrid />
    </ScrollArea>
  </PageContainer>
);
