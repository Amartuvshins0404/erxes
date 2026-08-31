import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';

const IndexPage = lazy(() =>
  import('~/pages/agents/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

/**
 * Main router for the plugin, mounted by the host at `/erxes-agent/*` via
 * the `./erxes_agent` expose. The chat page is the plugin root itself — no
 * intermediate route segment and no catch-all route.
 */
export const ErxesAgent = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route index element={<IndexPage />} />
      </Routes>
    </Suspense>
  );
};
