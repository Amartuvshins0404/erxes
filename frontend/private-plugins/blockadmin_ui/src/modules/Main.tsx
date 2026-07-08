import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import '../styles.css';

const ProjectsPage = lazy(() =>
  import('~/pages/ProjectsPage').then((module) => ({
    default: module.ProjectsPage,
  })),
);

const ProjectDetail = lazy(() =>
  import('~/pages/ProjectDetail').then((module) => ({
    default: module.ProjectDetail,
  })),
);

export const StackingPlanPage = lazy(() =>
  import('~/pages/StackingPlanPage').then((module) => ({
    default: module.StackingPlanPage,
  })),
);

const DevelopersPage = lazy(() =>
  import('~/pages/DevelopersPage').then((module) => ({
    default: module.DevelopersPage,
  })),
);

const DeveloperDetail = lazy(() =>
  import('~/pages/DeveloperDetail').then((module) => ({
    default: module.DeveloperDetail,
  })),
);

const SubmissionsPage = lazy(() =>
  import('~/pages/SubmissionsPage').then((module) => ({
    default: module.SubmissionsPage,
  })),
);

const AgenciesPage = lazy(() =>
  import('~/pages/AgenciesPage').then((module) => ({
    default: module.AgenciesPage,
  })),
);

const AgencyDetailPage = lazy(() =>
  import('~/pages/AgencyDetailPage').then((module) => ({
    default: module.AgencyDetailPage,
  })),
);

const AgencyListingPage = lazy(() =>
  import('~/pages/AgencyListingPage').then((module) => ({
    default: module.AgencyListingPage,
  })),
);

const AdminListingDetailPage = lazy(() =>
  import('~/pages/AdminListingDetailPage').then((module) => ({
    default: module.AdminListingDetailPage,
  })),
);

const SuppliersPage = lazy(() =>
  import('@/supplier/profile/pages/SuppliersPage').then((module) => ({
    default: module.SuppliersPage,
  })),
);

const ProductsPage = lazy(() =>
  import('@/supplier/product/pages/ProductsPage').then((module) => ({
    default: module.ProductsPage,
  })),
);

const MembersPage = lazy(() =>
  import('@/membership/pages/MembersPage').then((module) => ({
    default: module.MembersPage,
  })),
);

const Main = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/developers/:id" element={<DeveloperDetail />} />

        <Route path="/agencies">
          <Route index element={<Navigate to="agencies" replace />} />
          <Route path="agencies">
            <Route index element={<AgenciesPage />} />
            <Route path=":id" element={<AgencyDetailPage />} />
          </Route>
          <Route path="listing">
            <Route index element={<AgencyListingPage />} />
            <Route path=":listingId" element={<AdminListingDetailPage />} />
          </Route>
        </Route>

        <Route path="/form">
          <Route index element={<Navigate to="submissions" replace />} />
          <Route path="submissions">
            <Route index element={<Navigate to="1" replace />} />
            <Route path=":id" element={<SubmissionsPage />} />
          </Route>
        </Route>

        <Route path="/supplier">
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<SuppliersPage />} />
          <Route path="products" element={<ProductsPage />} />
        </Route>

        <Route path="/membership" element={<MembersPage />} />

        <Route path="/stacking-plan" element={<StackingPlanPage />} />
      </Routes>
    </Suspense>
  );
};

export default Main;
