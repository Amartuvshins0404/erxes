import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { Spinner } from 'erxes-ui';

const CarsIndexPage = lazy(() =>
  import('~/pages/cars/CarsIndexPage').then((module) => ({
    default: module.CarsIndexPage,
  })),
);

const CarCategoriesPage = lazy(() =>
  import('~/pages/categories/CarCategoriesPage').then((module) => ({
    default: module.CarCategoriesPage,
  })),
);

const Main = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<CarsIndexPage />} />
        <Route path="/categories" element={<CarCategoriesPage />} />
        <Route path="/:carId" element={<CarsIndexPage />} />
        <Route path="*" element={<Navigate to="/car" replace />} />
      </Routes>
    </Suspense>
  );
};

export default Main;
