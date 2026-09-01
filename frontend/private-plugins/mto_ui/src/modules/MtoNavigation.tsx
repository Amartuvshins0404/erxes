import { NavigationMenuLinkItem } from 'erxes-ui';
import {
  IconList,
  IconForms,
  IconCalendarEvent,
  IconCategory,
  IconBuildingCommunity,
  IconUser,
} from '@tabler/icons-react';
import { useMtoMode } from './config/hooks/useMtoMode';

export const MtoNavigation = () => {
  const { isSlaveMode } = useMtoMode();

  return (
    <>
      <NavigationMenuLinkItem
        name="Profile"
        icon={IconUser}
        pathPrefix="mto"
        path="profile"
      />
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
          name="Travel Associations"
          icon={IconBuildingCommunity}
          pathPrefix="mto"
          path="travel-associations"
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
