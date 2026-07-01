import { ReactNode, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Spinner } from 'erxes-ui';
import { PluginErrorBoundary } from '~/components/PluginErrorBoundary';

/**
 * Shared route scaffold for the plugin's lazy route modules: the error boundary
 * (recovers from failed chunk loads), a Suspense spinner, and the index /
 * wildcard redirects to a default path. Each module supplies only its concrete
 * `<Route>` list as children.
 *
 * `defaultPath` MUST be an absolute path (leading `/`). A relative target here
 * is resolved by react-router against the matched route's full pathname, and on
 * the `*` route that pathname is the entire unmatched URL (splat included) — so
 * a relative redirect appends a segment to the unmatched URL every render,
 * producing a new non-matching location each time and an infinite redirect loop
 * ("Maximum update depth exceeded"). An absolute path bypasses that resolution.
 */
export const PluginRoutesShell = ({
  defaultPath,
  children,
}: {
  defaultPath: string;
  children: ReactNode;
}) => (
  <PluginErrorBoundary>
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route index element={<Navigate to={defaultPath} replace />} />
        {children}
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </Suspense>
  </PluginErrorBoundary>
);
