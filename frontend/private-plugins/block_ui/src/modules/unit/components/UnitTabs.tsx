import { UNIT_DOCUMENT_TABS_KEYS } from '@/unit/constants/unit';
import { useQueryState } from 'erxes-ui';
import { lazy, Suspense } from 'react';

const UnitDetailOverview = lazy(() =>
  import('./UnitDetailOverview').then((module) => ({
    default: module.UnitDetailOverview,
  })),
);

const UnitContract = lazy(() =>
  import('./UnitContract').then((module) => ({
    default: module.UnitContract,
  })),
);

const UnitOpportunity = lazy(() =>
  import('./UnitOpportunity').then((module) => ({
    default: module.UnitOpportunity,
  })),
);

export const UnitTabs = () => {
  const [activeUnitTab] = useQueryState('activeUnitTab', {
    defaultValue: UNIT_DOCUMENT_TABS_KEYS.overview,
  });

  return (
    <Suspense>
      {activeUnitTab === UNIT_DOCUMENT_TABS_KEYS.overview && (
        <UnitDetailOverview />
      )}
      {activeUnitTab === UNIT_DOCUMENT_TABS_KEYS.opportunities && (
        <UnitOpportunity />
      )}
      {activeUnitTab === UNIT_DOCUMENT_TABS_KEYS.contracts && <UnitContract />}
    </Suspense>
  );
};
