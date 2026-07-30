import { IconBuildingStore, IconCreditCard, IconCurrencyYuan, IconFileDescription, IconPackage, IconUsers } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import { IUIConfig } from 'erxes-ui';

const MushopNavigation = lazy(() =>
  import('@/MushopNavigation').then((module) => ({
    default: module.MushopNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'mushop',
  path: 'mushop',
  i18n: true,
  navigationGroup: {
    name: 'mushop',
    icon: IconBuildingStore,
    content: () => (
      <Suspense fallback={<div />}>
        <MushopNavigation />
      </Suspense>
    ),
  },

  modules: [
    {
      name: 'Supplier',
      icon: IconUsers,
      path: 'suppliers',
    },
    {
      name: 'Products',
      icon: IconPackage,
      path: 'products',
    },
    {
      name: 'Members',
      icon: IconCreditCard,
      path: 'members',
    },
    {
      name: 'Collectives',
      icon: IconBuildingStore,
      path: 'collectives',
    },
  ],

  widgets: {
    relationWidgets: [
      {
        name: 'membership_plan',
        icon: IconFileDescription,
      },
    ],
    formWidgets: [
      {
        name: 'mushop',
        contentType: 'core:product',
        icon: IconCurrencyYuan,
      },
    ],
  },
};
