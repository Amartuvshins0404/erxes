import { NavigationMenuLinkItem } from 'erxes-ui';
import { IconActivity, IconSettings } from '@tabler/icons-react';
import { useOneFitInstanceId } from '@/config/hooks/useOneFitInstanceId';
import { useOneFitMode } from '@/config/hooks/useOneFitMode';
import { OneFitNavigation } from './OneFitNavigation';

export function OneFitNavigationWithGuard() {
  const { isSlaveMode } = useOneFitMode();
  const { instanceId, loading } = useOneFitInstanceId();

  if (loading) {
    return (
      <NavigationMenuLinkItem
        name="OneFit"
        icon={IconActivity}
        pathPrefix="onefit"
        path=""
      />
    );
  }

  const missingInstanceId = !instanceId || instanceId.trim() === '';
  if (isSlaveMode && missingInstanceId) {
    return (
      <>
        <NavigationMenuLinkItem
          name="Complete OneFit setup"
          icon={IconSettings}
          pathPrefix="settings"
          path="onefit"
        />
      </>
    );
  }

  return <OneFitNavigation />;
}
