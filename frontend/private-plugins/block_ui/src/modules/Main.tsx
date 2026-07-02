import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';

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

const DeveloperInfoPage = lazy(() =>
  import('~/pages/DeveloperInfoPage').then((module) => ({
    default: module.DeveloperInfoPage,
  })),
);

const ContractsPage = lazy(() =>
  import('~/pages/ContractsPage').then((module) => ({
    default: module.ContractsPage,
  })),
);

const OpptysPage = lazy(() =>
  import('~/pages/OpptysPage').then((module) => ({
    default: module.OpptysPage,
  })),
);

const OffersPage = lazy(() =>
  import('~/pages/OffersPage').then((module) => ({
    default: module.OffersPage,
  })),
);

const PaymentsPage = lazy(() =>
  import('~/pages/PaymentsPage').then((module) => ({
    default: module.PaymentsPage,
  })),
);

const OverviewPage = lazy(() =>
  import('~/pages/OverviewPage').then((module) => ({
    default: module.OverviewPage,
  })),
);

const Main = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        <Route path="project/:projectId">
          <Route path="overview" element={<OverviewPage />} />
          <Route path="stacking-plan" element={<StackingPlanPage />} />
          <Route path="opportunities" element={<OpptysPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
        </Route>
        <Route path="/developer-info" element={<DeveloperInfoPage />} />
      </Routes>
    </Suspense>
  );
};

export default Main;
