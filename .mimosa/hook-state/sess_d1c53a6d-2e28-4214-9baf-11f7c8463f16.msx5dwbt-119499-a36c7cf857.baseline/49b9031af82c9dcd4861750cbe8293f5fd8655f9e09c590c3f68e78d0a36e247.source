import { NavigationMenuLinkItem } from 'erxes-ui';
import { IconActivity, IconSettings } from '@tabler/icons-react';
import { useMtoInstanceId } from '@/config/hooks/useMtoInstanceId';
import { useMtoMode } from '@/config/hooks/useMtoMode';
import { MtoNavigation } from './MtoNavigation';

export function MtoNavigationWithGuard() {
  const { isSlaveMode } = useMtoMode();
  const { instanceId, loading } = useMtoInstanceId();

  if (loading) {
    return (
      <NavigationMenuLinkItem
        name="Mto"
        icon={IconActivity}
        pathPrefix="mto"
        path=""
      />
    );
  }

  const missingInstanceId = !instanceId || instanceId.trim() === '';
  if (isSlaveMode && missingInstanceId) {
    return (
      <>
        <NavigationMenuLinkItem
          name="Complete Mto setup"
          icon={IconSettings}
          pathPrefix="settings"
          path="mto"
        />
      </>
    );
  }

  return <MtoNavigation />;
}
