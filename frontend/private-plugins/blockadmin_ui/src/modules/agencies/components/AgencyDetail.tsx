import { IconBuildingOff } from '@tabler/icons-react';
import { Empty, ScrollArea, Spinner } from 'erxes-ui';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { AgencyDetailProfile } from './AgencyDetailProfile';
import { AgencyDetailSidebar } from './AgencyDetailSidebar';
import { AgencyDetailTabs } from './AgencyDetailTabs';

export const AgencyDetail = () => {
  const { agency, loading, error } = useAgencyDetail();

  if (loading) return <Spinner containerClassName="py-32" />;

  if (error || !agency) {
    return (
      <Empty className="py-32">
        <Empty.Content>
          <Empty.Header>
            <Empty.Media>
              <IconBuildingOff />
            </Empty.Media>
            <Empty.Title>Agency not found</Empty.Title>
            <Empty.Description>
              {error?.message ??
                'This agency no longer exists or you do not have access to it.'}
            </Empty.Description>
          </Empty.Header>
        </Empty.Content>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col flex-auto overflow-hidden">
      <AgencyDetailProfile />
      <div className="flex flex-auto overflow-hidden">
        <AgencyDetailSidebar />
        <ScrollArea className="flex-auto bg-sidebar">
          <AgencyDetailTabs />
          <ScrollArea.Bar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};
