import { IUIConfig } from 'erxes-ui';
import { Suspense, lazy } from 'react';
import { IconBlocks } from '@tabler/icons-react';

const BlockNavigation = lazy(() =>
  import('./modules/navigations/BlockNavigation').then((module) => ({
    default: module.BlockNavigation,
  })),
);

const BlockProjectsNavigation = lazy(() =>
  import('./modules/navigations/BlockProjectsNavigation').then((module) => ({
    default: module.BlockProjectsNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'block',
  path: 'block',
  hasFloatingWidget: true,
  modules: [
    {
      name: 'developer info',
      icon: IconBlocks,
      path: 'block/developer-info',
    },
    {
      name: 'block',
      icon: IconBlocks,
      path: 'block',
      hasRelationWidget: true,
    },
  ],
  navigationGroup: {
    name: 'block',
    icon: IconBlocks,
    content: () => (
      <Suspense fallback={<div />}>
        <BlockNavigation />
      </Suspense>
    ),
    subGroup: () => (
      <Suspense fallback={<div />}>
        <BlockProjectsNavigation />
      </Suspense>
    ),
  },
  widgets: {
    relationWidgets: [
      {
        name: 'oppty',
        icon: IconBlocks,
      },
    ],
  },
};
