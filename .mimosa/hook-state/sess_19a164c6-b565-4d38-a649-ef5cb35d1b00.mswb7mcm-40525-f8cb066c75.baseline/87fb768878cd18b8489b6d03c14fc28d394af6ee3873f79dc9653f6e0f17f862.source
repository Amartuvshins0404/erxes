import { Suspense, lazy } from 'react';

import type { IRelationWidgetProps } from 'ui-modules';

const CarsRelationWidget = lazy(() =>
  import('./modules/CarsRelationWidget').then((module) => ({
    default: module.CarsRelationWidget,
  })),
);

export const RelationWidgets = (props: IRelationWidgetProps) => {
  return (
    <Suspense>
      {props.module === 'car' ? <CarsRelationWidget {...props} /> : null}
    </Suspense>
  );
};

export default RelationWidgets;
