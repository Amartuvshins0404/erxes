import { NavigationMenuLinkItem } from 'erxes-ui';
import { Can } from 'ui-modules';
import { useTranslation } from 'react-i18next';
import {
  IconBuildingStore,
  IconCreditCard,
  IconPackage,
  IconTruckDelivery,
  IconUsers,
} from '@tabler/icons-react';

export const MushopNavigation = () => {
  const { t } = useTranslation('mushop');

  return (
    <>
      <Can module="supplier">
        <NavigationMenuLinkItem
          name={t('Suppliers')}
          icon={IconUsers}
          path="suppliers"
          pathPrefix="mushop"
        />
      </Can>
      <Can module="product">
        <NavigationMenuLinkItem
          name={t('Products')}
          icon={IconPackage}
          path="products"
          pathPrefix="mushop"
        />
      </Can>
      <Can module="order">
        <NavigationMenuLinkItem
          name={t('Orders')}
          icon={IconTruckDelivery}
          path="orders"
          pathPrefix="mushop"
        />
      </Can>
      <NavigationMenuLinkItem
        name={t('Members')}
        icon={IconCreditCard}
        path="members"
        pathPrefix="mushop"
      />
      <Can module="collective">
        <NavigationMenuLinkItem
          name={t('Collectives')}
          icon={IconBuildingStore}
          path="collectives"
          pathPrefix="mushop"
        />
      </Can>
    </>
  );
};
