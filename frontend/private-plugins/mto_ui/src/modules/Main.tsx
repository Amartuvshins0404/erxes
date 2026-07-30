import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Spinner } from 'erxes-ui';
import { useMtoInstanceId } from '@/config/hooks/useMtoInstanceId';
import { useMtoMode } from './config/hooks/useMtoMode';
import { MtoOnboardingPage } from '~/pages/MtoOnboardingPage';

const IndexPage = lazy(() =>
  import('~/pages/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

const AssociationsPage = lazy(() =>
  import('~/pages/AssociationsPage').then((module) => ({
    default: module.AssociationsPage,
  })),
);

const EventsPage = lazy(() =>
  import('~/pages/EventsPage').then((module) => ({
    default: module.EventsPage,
  })),
);

const CategoriesPage = lazy(() =>
  import('~/pages/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  })),
);

const RegistrationIndexPage = lazy(() =>
  import('~/pages/RegistrationIndexPage').then((module) => ({
    default: module.RegistrationIndexPage,
  })),
);

const RegistrationsPage = lazy(() =>
  import('~/pages/RegistrationsPage').then((module) => ({
    default: module.RegistrationsPage,
  })),
);

const RegistrationSchemasPage = lazy(() =>
  import('../pages/RegistrationSchemasBuilderPage').then((module) => ({
    default: module.RegistrationSchemasBuilderPage,
  })),
);

const MtoMain = () => {
  const { isSlaveMode } = useMtoMode();
  const { instanceId, loading } = useMtoInstanceId();

  const hasInstanceId = Boolean(instanceId) && String(instanceId).trim() !== '';

  const requireInstanceId = isSlaveMode && !hasInstanceId;

  if (isSlaveMode && loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner />
      </div>
    );
  }

  if (requireInstanceId) {
    return <MtoOnboardingPage />;
  }

  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        {!isSlaveMode && (
          <Route path="/associations" element={<AssociationsPage />} />
        )}
        {!isSlaveMode && <Route path="/events" element={<EventsPage />} />}
        {!isSlaveMode && (
          <Route path="/categories" element={<CategoriesPage />} />
        )}
        <Route path="/registration" element={<RegistrationIndexPage />} />
        <Route path="/registrations" element={<RegistrationsPage />} />
        <Route path="/fillform" element={<RegistrationSchemasPage />} />
      </Routes>
    </Suspense>
  );
};

export default MtoMain;
