import { IUIConfig } from 'erxes-ui';
import { Suspense, lazy } from 'react';
import { IconBusinessplan } from '@tabler/icons-react';

const BtkAdminNavigation = lazy(() =>
  import('./modules/BtkAdminNavigation').then((module) => ({
    default: module.BtkAdminNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'btkadmin',
  path: 'btkadmin',
  modules: [
    {
      name: 'companies',
      icon: IconBusinessplan,
      path: 'btkadmin/companies',
    },
    {
      name: 'btkadmin',
      icon: IconBusinessplan,
      path: 'btkadmin',
      hasSettings: false,
    },
  ],
  navigationGroup: {
    name: 'btkadmin',
    icon: IconBusinessplan,
    content: () => (
      <Suspense fallback={<div />}>
        <BtkAdminNavigation />
      </Suspense>
    ),
  },
};
