import { IconChartArcs } from '@tabler/icons-react';
import { Breadcrumb, Button, PageContainer, Separator } from 'erxes-ui';
import { PageHeader, createFavoriteBreadcrumb } from 'ui-modules';
import { AgencyDashboardWindow } from '~/modules/dashboard/components/AgencyDashboardWindow';

export const DashboardIndexPage = () => {
  const favoriteBreadcrumb = createFavoriteBreadcrumb('Dashboard');

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Button variant="ghost">
                  <IconChartArcs />
                  Dashboard
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={favoriteBreadcrumb}
            icon="IconChartArcs"
          />
        </PageHeader.Start>
      </PageHeader>

      <div className="flex flex-col flex-auto overflow-hidden">
        <AgencyDashboardWindow />
      </div>
    </PageContainer>
  );
};
