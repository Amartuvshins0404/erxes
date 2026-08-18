import {
  IconBike,
  IconBuildingStore,
  IconCalendar,
  IconCreditCard,
  IconLayoutDashboard,
  IconTags,
  IconUsers,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { MainIndicatorsDashboard } from '~/components/dashboard/MainIndicatorsDashboard';
import { OneFitPageLayout } from '~/components/OneFitPageLayout';
import { useOneFitMode } from '~/modules/config/hooks/useOneFitMode';

export function DashboardPage() {
  const { isSlaveMode } = useOneFitMode();

  return (
    <OneFitPageLayout
      pageName="Dashboard"
      pageIcon={<IconLayoutDashboard className="size-4" />}
    >
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-col h-full overflow-auto flex-auto p-6">
          <MainIndicatorsDashboard />
        </div>
      </div>
    </OneFitPageLayout>
  );
}
