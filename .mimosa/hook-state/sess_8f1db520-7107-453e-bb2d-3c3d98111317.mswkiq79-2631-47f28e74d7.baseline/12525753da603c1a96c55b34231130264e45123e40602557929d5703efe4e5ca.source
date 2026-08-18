import { Spinner } from 'erxes-ui';
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';

const EventsPage = lazy(() =>
  import('~/pages/events/EventsPage').then((module) => ({
    default: module.EventsPage,
  })),
);

export const Main = () => (
  <Suspense fallback={<Spinner />}>
    <Routes>
      <Route path="/" element={<EventsPage />} />
      <Route path="*" element={<Navigate to="/event" replace />} />
    </Routes>
  </Suspense>
);
