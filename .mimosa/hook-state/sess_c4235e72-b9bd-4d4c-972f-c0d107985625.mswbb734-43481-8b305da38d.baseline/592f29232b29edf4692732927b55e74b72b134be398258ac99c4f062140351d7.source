import { useQueryState } from 'erxes-ui';
import { UNIT_DOCUMENT_TABS_KEYS } from '@/unit/constants/unit';
import { lazy, Suspense } from 'react';

const UnitDetailOverview = lazy(() =>
  import('./UnitDetailOverview').then((module) => ({
    default: module.UnitDetailOverview,
  })),
);

const UnitDocument = lazy(() =>
  import('./UnitDocument').then((module) => ({
    default: module.UnitDocument,
  })),
);

const UnitMedia = lazy(() =>
  import('./UnitMedia').then((module) => ({
    default: module.UnitMedia,
  })),
);

const UnitContract = lazy(() =>
  import('./UnitContract').then((module) => ({
    default: module.UnitContract,
  })),
);

const UnitOffers = lazy(() =>
  import('./UnitOffers').then((module) => ({
    default: module.UnitOffers,
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
      {activeUnitTab === UNIT_DOCUMENT_TABS_KEYS.document && <UnitDocument />}
      {activeUnitTab === UNIT_DOCUMENT_TABS_KEYS.media && <UnitMedia />}
      {activeUnitTab === UNIT_DOCUMENT_TABS_KEYS.contracts && <UnitContract />}
      {activeUnitTab === UNIT_DOCUMENT_TABS_KEYS.offers && <UnitOffers />}
    </Suspense>
  );
};
