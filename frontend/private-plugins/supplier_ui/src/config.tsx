import { IconPackages } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import { IUIConfig } from 'erxes-ui';

const NavigationList = lazy(() =>
  import('@/NavigationList').then((module) => ({
    default: module.NavigationList,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'supplier',
  path: 'supplier',
  navigationGroup: {
    name: 'supplier',
    icon: IconPackages,
    content: () => (
      <Suspense fallback={<div />}>
        <NavigationList />
      </Suspense>
    ),
  },

  modules: [
    {
      name: 'supplier',
      icon: IconPackages,
      path: 'supplier',
    },
  ],
};
