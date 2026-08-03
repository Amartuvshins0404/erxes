import {
  IconBuildingStore,
  IconCreditCard,
  IconCurrencyYuan,
  IconFileDescription,
  IconPackage,
  IconUsers,
} from '@tabler/icons-react';
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
      path: 'mushop/suppliers',
    },
    {
      name: 'Products',
      icon: IconPackage,
      path: 'mushop/products',
    },
    {
      name: 'Members',
      icon: IconCreditCard,
      path: 'mushop/members',
    },
    {
      name: 'Collectives',
      icon: IconBuildingStore,
      path: 'mushop/collectives',
    },
    {
      name: 'mushop',
      icon: IconBuildingStore,
      path: 'mushop',
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
