import { IconId } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  ScrollArea,
  Separator,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { AgencyProfileSidebar } from '~/modules/agency/components/AgencyProfileSidebar';
import { AgencyProfileTabs } from '~/modules/agency/components/AgencyProfileTabs';
import { AgencyProfileDetailHeader } from '~/modules/agency/components/AgencyProfileDetailHeader';

export const IndexPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost">
                  <IconId />
                  Agency Profile
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>
      <div className="flex flex-auto overflow-hidden">
        <AgencyProfileSidebar />
        <div className="flex flex-col flex-auto overflow-hidden">
          <AgencyProfileDetailHeader />
          <ScrollArea className="flex-auto bg-sidebar">
            <AgencyProfileTabs />
            <ScrollArea.Bar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </PageContainer>
  );
};
