import { NavigationMenuLinkItem } from 'erxes-ui';
import {
  IconBuildingStore,
  IconPackage,
  IconUser,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useIsCollective } from '~/hooks/useIsCollective';

export const NavigationList = () => {
  const isCollective = useIsCollective();

  if (isCollective) {
    return (
      <>
        <NavigationMenuLinkItem
          name="profile"
          icon={IconUsersGroup}
          path="profile"
          pathPrefix="supplier"
        />
        <NavigationMenuLinkItem
          name="suppliers"
          icon={IconBuildingStore}
          path="suppliers"
          pathPrefix="supplier"
        />
        <NavigationMenuLinkItem
          name="packages"
          icon={IconPackage}
          path="packages"
          pathPrefix="supplier"
        />
      </>
    );
  }

  return (
    <NavigationMenuLinkItem
      name="profile"
      icon={IconUser}
      path="profile"
      pathPrefix="supplier"
    />
  );
};
