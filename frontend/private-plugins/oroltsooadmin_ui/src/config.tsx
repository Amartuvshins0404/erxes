import { IconShieldCheck, IconWriting } from '@tabler/icons-react';
import { IUIConfig } from 'erxes-ui';
import { lazy, Suspense } from 'react';

const OroltsooAdminNavigation = lazy(() =>
  import('@/OroltsooAdminNavigation').then((module) => ({
    default: module.OroltsooAdminNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'oroltsooadmin',
  path: 'oroltsooadmin',
  navigationGroup: {
    name: 'OroltsooAdmin',
    defaultPath: 'oroltsooadmin/profiles',
    icon: IconShieldCheck,
    content: () => (
      <Suspense fallback={<div />}>
        <OroltsooAdminNavigation />
      </Suspense>
    ),
  },
  modules: [
    {
      name: 'profiles',
      icon: IconShieldCheck,
      path: 'oroltsooadmin/profiles',
    },
    {
      name: 'posts',
      icon: IconWriting,
      path: 'oroltsooadmin/posts',
    },
  ],
};
