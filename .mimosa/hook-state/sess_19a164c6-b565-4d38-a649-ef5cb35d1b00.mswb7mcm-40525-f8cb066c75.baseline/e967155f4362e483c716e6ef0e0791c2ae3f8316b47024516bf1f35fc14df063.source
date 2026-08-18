import { Spinner, useQueryState } from 'erxes-ui';
import { Suspense, lazy } from 'react';

const AdminListingDetailGeneral = lazy(() =>
  import('./AdminListingDetailGeneral').then((m) => ({
    default: m.AdminListingDetailGeneral,
  })),
);

const AdminListingDetailLocation = lazy(() =>
  import('./AdminListingDetailLocation').then((m) => ({
    default: m.AdminListingDetailLocation,
  })),
);

const AdminListingDetailPricing = lazy(() =>
  import('./AdminListingDetailPricing').then((m) => ({
    default: m.AdminListingDetailPricing,
  })),
);

const AdminListingDetailSpecs = lazy(() =>
  import('./AdminListingDetailSpecs').then((m) => ({
    default: m.AdminListingDetailSpecs,
  })),
);

const AdminListingDetailMedia = lazy(() =>
  import('./AdminListingDetailMedia').then((m) => ({
    default: m.AdminListingDetailMedia,
  })),
);

export const AdminListingDetailTabs = () => {
  const [activeTab] = useQueryState('tab', { defaultValue: 'general' });

  return (
    <Suspense fallback={<Spinner containerClassName="py-32" />}>
      {activeTab === 'general' && <AdminListingDetailGeneral />}
      {activeTab === 'location' && <AdminListingDetailLocation />}
      {activeTab === 'pricing' && <AdminListingDetailPricing />}
      {activeTab === 'specs' && <AdminListingDetailSpecs />}
      {activeTab === 'media' && <AdminListingDetailMedia />}
    </Suspense>
  );
};
