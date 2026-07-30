import { AgenciesBreadcrumb } from '@/agencies/components/AgenciesBreadcrumb';
import { AgencyDetail } from '@/agencies/components/AgencyDetail';
import { AgencyDetailBreadcrumb } from '@/agencies/components/AgencyDetailBreadcrumb';
import { PageContainer, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';

export const AgencyDetailPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <AgenciesBreadcrumb>
            <AgencyDetailBreadcrumb />
          </AgenciesBreadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <div className="flex-auto min-h-0">
        <AgencyDetail />
      </div>
    </PageContainer>
  );
};
