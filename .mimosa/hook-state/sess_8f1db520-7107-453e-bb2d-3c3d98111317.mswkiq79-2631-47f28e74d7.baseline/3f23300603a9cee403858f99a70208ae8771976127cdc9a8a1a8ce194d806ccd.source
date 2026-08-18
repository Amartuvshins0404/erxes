import { DevelopersBreadcrumb } from '@/developer/components/DeveloperBreadcrumb';
import { Developers } from '@/developer/components/Developers';
import { DevelopersFilter } from '@/developer/components/DevelopersFilter';
import { PageContainer, PageSubHeader, ScrollArea, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';

export const DevelopersPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <DevelopersBreadcrumb />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <PageSubHeader>
        <DevelopersFilter />
      </PageSubHeader>
      <ScrollArea className="flex-auto">
        <Developers />
      </ScrollArea>
    </PageContainer>
  );
};
