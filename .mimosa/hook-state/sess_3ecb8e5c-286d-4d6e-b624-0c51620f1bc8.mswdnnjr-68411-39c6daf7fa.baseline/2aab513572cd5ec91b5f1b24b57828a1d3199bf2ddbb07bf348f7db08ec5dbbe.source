import { IconPackage, IconUser } from '@tabler/icons-react';
import { NavigationMenuGroup, NavigationMenuLinkItem } from 'erxes-ui';
import { useLocation } from 'react-router-dom';

export const SupplierNavigation = () => {
  const location = useLocation();

  const isOnSupplierRoute = location.pathname.startsWith(
    '/blockadmin/supplier',
  );

  if (!isOnSupplierRoute) return null;

  return (
    <NavigationMenuGroup name="Supplier">
      <NavigationMenuLinkItem
        name="Profile"
        icon={IconUser}
        path="/blockadmin/supplier/profile"
      />
      <NavigationMenuLinkItem
        name="Products"
        icon={IconPackage}
        path="/blockadmin/supplier/products"
      />
    </NavigationMenuGroup>
  );
};
