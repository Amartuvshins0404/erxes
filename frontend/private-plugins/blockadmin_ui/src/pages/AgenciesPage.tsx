import { AgenciesFilter } from '@/agencies/components/AgenciesFilter';
import { AgenciesSubNav } from '@/agencies/components/AgenciesSubNav';
import {
  AgencyView,
  AgencyViewControl,
} from '@/agencies/components/AgenciesView';
import { PageContainer, PageSubHeader, ScrollArea, Separator } from 'erxes-ui';
import { PageHeader, createFavoriteBreadcrumb } from 'ui-modules';

export const AgenciesPage = () => {
  const favoriteBreadcrumb = createFavoriteBreadcrumb('Agencies');

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <AgenciesSubNav />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={favoriteBreadcrumb}
            icon="IconClipboardTextFilled"
          />
        </PageHeader.Start>
      </PageHeader>
      <PageSubHeader>
        <AgenciesFilter />
        <AgencyViewControl />
      </PageSubHeader>
      <ScrollArea className="flex-auto">
        <AgencyView />
      </ScrollArea>
    </PageContainer>
  );
};
