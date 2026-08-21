import { AgenciesBreadcrumb } from '@/agencies/components/AgenciesBreadcrumb';
import { AgencyDetail } from '@/agencies/components/AgencyDetail';
import { AgencyDetailBreadcrumb } from '@/agencies/components/AgencyDetailBreadcrumb';
import { useAgencyDetail } from '@/agencies/hooks/useAgencyDetail';
import { PageContainer, Separator } from 'erxes-ui';
import { PageHeader, createFavoriteBreadcrumb } from 'ui-modules';

export const AgencyDetailPage = () => {
  const { agency } = useAgencyDetail();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <AgenciesBreadcrumb>
            <AgencyDetailBreadcrumb />
          </AgenciesBreadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={createFavoriteBreadcrumb('Agencies', agency?.name)}
          />
        </PageHeader.Start>
      </PageHeader>
      <AgencyDetail />
    </PageContainer>
  );
};
