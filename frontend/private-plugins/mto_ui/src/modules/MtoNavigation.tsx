import { NavigationMenuLinkItem } from 'erxes-ui';
import {
  IconActivity,
  IconList,
  IconForms,
  IconCalendarEvent,
  IconCategory,
} from '@tabler/icons-react';
import { useMtoMode } from './config/hooks/useMtoMode';

export const MtoNavigation = () => {
  const { isSlaveMode } = useMtoMode();

  return (
    <>

      {!isSlaveMode && (
        <NavigationMenuLinkItem
          name="Categories"
          icon={IconCategory}
          pathPrefix="mto"
          path="categories"
        />
      )}
      {!isSlaveMode && (
        <NavigationMenuLinkItem
          name="Events"
          icon={IconCalendarEvent}
          pathPrefix="mto"
          path="events"
        />
      )}
      <NavigationMenuLinkItem
        name="Registrations"
        icon={IconList}
        pathPrefix="mto"
        path="registrations"
      />
      {!isSlaveMode && (
        <NavigationMenuLinkItem
          name="FillForm"
          icon={IconForms}
          pathPrefix="mto"
          path="fillform"
        />
      )}
    </>
  );
};
