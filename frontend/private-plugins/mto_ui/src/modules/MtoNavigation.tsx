import { NavigationMenuLinkItem } from 'erxes-ui';
import {
  IconActivity,
  IconTags,
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
      <NavigationMenuLinkItem
        name="Mto"
        icon={IconActivity}
        pathPrefix="mto"
        path=""
      />
      {!isSlaveMode && (
        <NavigationMenuLinkItem
          name="Associations"
          icon={IconTags}
          pathPrefix="mto"
          path="associations"
        />
      )}
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
