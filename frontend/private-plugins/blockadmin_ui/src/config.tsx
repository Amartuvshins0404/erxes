import { IUIConfig } from 'erxes-ui';
import { Suspense, lazy } from 'react';
import { IconBlocks } from '@tabler/icons-react';

const BlockNavigation = lazy(() =>
  import('./modules/BlockAdminNavigation').then((module) => ({
    default: module.BlockNavigation,
  })),
);

const FormNavigation = lazy(() =>
  import('./modules/navigation/FormNavigation').then((module) => ({
    default: module.FormNavigation,
  })),
);

const SupplierNavigation = lazy(() =>
  import('./modules/navigation/SupplierNavigation').then((module) => ({
    default: module.SupplierNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'blockadmin',
  path: 'blockadmin',
  modules: [
    {
      name: 'developers',
      icon: IconBlocks,
      path: 'blockadmin/developers',
    },
    {
      name: 'blockadmin',
      icon: IconBlocks,
      path: 'blockadmin',
    },
  ],
  navigationGroup: {
    name: 'blockadmin',
    icon: IconBlocks,
    content: () => (
      <Suspense fallback={<div />}>
        <BlockNavigation />
      </Suspense>
    ),
    subGroup: () => (
      <Suspense fallback={<div />}>
        <SupplierNavigation />
        <FormNavigation />
      </Suspense>
    ),
  },
};
