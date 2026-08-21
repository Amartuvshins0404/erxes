import { Suspense, lazy } from 'react';

import type { IRelationWidgetProps } from 'ui-modules';

const Oppty = lazy(() =>
  import('./modules/Oppty').then((module) => ({
    default: module.Oppty,
  })),
);

const CustomerSync = lazy(() =>
  import('./modules/CustomerSync').then((module) => ({
    default: module.CustomerSync,
  })),
);

export const RelationWidgets = ({
  module,
  contentId,
  contentType,
  access,
  customerId,
  companyId,
}: IRelationWidgetProps) => {
  return (
    <Suspense>
      {module === 'oppty' ? (
        <Oppty
          contentId={contentId}
          contentType={contentType}
          customerId={customerId}
          companyId={companyId}
          access={access}
        />
      ) : module === 'customerSync' ? (
        <CustomerSync
          contentId={contentId}
          contentType={contentType}
          customerId={customerId}
          access={access}
        />
      ) : null}
    </Suspense>
  );
};

export default RelationWidgets;
