import { useState } from 'react';
import { AgenciesSubNav } from '@/agencies/components/AgenciesSubNav';
import { AdminListingFilterBar } from '@/agencies/listing/components/AdminListingFilter';
import { AdminListingFilter } from '@/agencies/listing/types/listingTypes';
import { PageContainer, PageSubHeader, ScrollArea, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import {
  AdminListingsViewControl,
  AdminListingView,
} from '@/agencies/listing/components/AdminListingsView';

export const AgencyListingPage = () => {
  const [filter, setFilter] = useState<AdminListingFilter>({});

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <AgenciesSubNav />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <PageSubHeader>
        <AdminListingFilterBar />
        <AdminListingsViewControl />
      </PageSubHeader>
      <ScrollArea className="flex-auto">
        <AdminListingView />
      </ScrollArea>
    </PageContainer>
  );
};
