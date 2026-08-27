import {
  IconUsersGroup,
  IconUserStar,
  IconWriting,
} from '@tabler/icons-react';
import { IUIConfig } from 'erxes-ui';
import { lazy, Suspense } from 'react';

const OroltsooNavigation = lazy(() =>
  import('@/OroltsooNavigation').then((module) => ({
    default: module.OroltsooNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'oroltsoo',
  path: 'oroltsoo',
  navigationGroup: {
    name: 'oroltsoo',
    defaultPath: 'oroltsoo/profile',
    icon: IconUserStar,
    content: () => (
      <Suspense fallback={<div />}>
        <OroltsooNavigation />
      </Suspense>
    ),
  },
  modules: [
    {
      name: 'profile',
      icon: IconUserStar,
      path: 'oroltsoo/profile',
    },
    {
      name: 'posts',
      icon: IconWriting,
      path: 'oroltsoo/posts',
    },
    {
      name: 'meetings',
      icon: IconUsersGroup,
      path: 'oroltsoo/meetings',
    },
  ],
};
