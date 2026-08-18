import { Suspense, lazy } from 'react';
import { OfferDetailSheet } from './OfferDetailSheet';

const OffersRecordTable = lazy(() =>
  import('./OffersRecordTable').then((mod) => ({
    default: mod.OffersRecordTable,
  })),
);

export const OffersView = () => {
  return (
    <Suspense>
      <OffersRecordTable />
      <OfferDetailSheet />
    </Suspense>
  );
};
