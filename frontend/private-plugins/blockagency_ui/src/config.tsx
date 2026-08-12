import { IconBuildingCommunity } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import { IUIConfig } from 'erxes-ui';

const BlockagencySettingsNavigation = lazy(() =>
  import('./modules/BlockagencySettingsNavigation').then((module) => ({
    default: module.BlockagencySettingsNavigation,
  })),
);

const BlockagencyNavigation = lazy(() =>
  import('./modules/BlockagencyNavigation').then((module) => ({
    default: module.BlockagencyNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'blockagency',
  path: 'blockagency',
  settingsNavigation: () => (
    <Suspense fallback={<div />}>
      <BlockagencySettingsNavigation />
    </Suspense>
  ),
  navigationGroup: {
    name: 'agency',
    icon: IconBuildingCommunity,
    content: () => (
      <Suspense fallback={<div />}>
        <BlockagencyNavigation />
      </Suspense>
    ),
  },

  modules: [
    {
      name: 'agency profile',
      icon: IconBuildingCommunity,
      path: 'blockagency/agency-profile',
    },
    {
      name: 'agency',
      icon: IconBuildingCommunity,
      path: 'blockagency',
    },
  ],
};
