import { Suspense } from 'react';
import type { IRelationWidgetProps } from 'ui-modules';
import { MembershipPlanWidget } from './MembershipPlanWidget';

export const RelationWidgets = ({
  module,
  contentId,
}: IRelationWidgetProps) => {
  return (
    <Suspense>
      {module === 'membership_plan' && (
        <MembershipPlanWidget contentId={contentId} />
      )}
    </Suspense>
  );
};

export default RelationWidgets;
