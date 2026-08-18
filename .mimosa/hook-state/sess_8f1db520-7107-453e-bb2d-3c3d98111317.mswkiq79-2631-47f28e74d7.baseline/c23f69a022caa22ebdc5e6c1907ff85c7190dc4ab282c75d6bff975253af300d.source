import { IUIConfig } from 'erxes-ui';
import { Suspense, lazy } from 'react';
import { IconActivity, IconUser } from '@tabler/icons-react';

const MtoNavigationWithGuard = lazy(() =>
  import('./modules/MtoNavigationWithGuard').then((module) => ({
    default: module.MtoNavigationWithGuard,
  })),
);

const MtoSettingsNavigation = lazy(() =>
  import('./modules/MtoSettingsNavigation').then((module) => ({
    default: module.MtoSettingsNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'mto',
  path: 'mto',

  modules: [
    {
      name: 'mto',
      icon: IconActivity,
      path: 'mto',
    },
  ],
  widgets: {
    relationWidgets: [
      {
        name: 'mtocustomer',
        icon: IconUser,
      },
    ],
  },
  settingsNavigation: () => (
    <Suspense fallback={<div />}>
      <MtoSettingsNavigation />
    </Suspense>
  ),
  navigationGroup: {
    name: 'mto',
    icon: IconActivity,
    content: () => (
      <Suspense fallback={<div />}>
        <MtoNavigationWithGuard />
      </Suspense>
    ),
  },
};
