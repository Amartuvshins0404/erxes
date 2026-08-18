import { PageContainer, Separator, ScrollArea } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { BtkCompanyList } from '~/modules/btk/components/btkCompanyList';
import { BtkCompanyBreadcrumb } from '~/modules/btk/components/BtkCompanyBreadcrumb';

export const CompanyListPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <BtkCompanyBreadcrumb />
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <ScrollArea className="flex-auto">
        <BtkCompanyList />
      </ScrollArea>
    </PageContainer>
  );
};
