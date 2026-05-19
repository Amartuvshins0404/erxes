import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

const SuppliersPage = lazy(() =>
  import('@/supplier/pages/SuppliersPage').then((module) => ({
    default: module.SuppliersPage,
  })),
);

const ProductsPage = lazy(() =>
  import('@/product/pages/ProductsPage').then((module) => ({
    default: module.ProductsPage,
  })),
);

const SubscribersPage = lazy(() =>
  import('@/subscriber/pages/SubscribersPage').then((module) => ({
    default: module.SubscribersPage,
  })),
);

const CollectivesPage = lazy(() =>
  import('@/collective/pages/CollectivesPage').then((module) => ({
    default: module.CollectivesPage,
  })),
);

const MushopMain = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/" element={<Navigate to="suppliers" replace />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="subscribers" element={<SubscribersPage />} />
        <Route path="collectives" element={<CollectivesPage />} />
      </Routes>
    </Suspense>
  );
};

export default MushopMain;
