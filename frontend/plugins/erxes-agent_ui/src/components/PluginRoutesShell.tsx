import { ReactNode, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { Spinner } from 'erxes-ui';
import { PluginErrorBoundary } from '~/components/PluginErrorBoundary';

/**
 * Redirect fallback for the `*` (no-match) route that is safe inside a
 * descendant `<Routes>`.
 *
 * The plugin mounts its own `<Routes>` under a host route (`/erxes-agent/*`,
 * `/settings/erxes-agent/*`). When the user navigates to *another* plugin, that
 * plugin's remote loads asynchronously and suspends, so React keeps this subtree
 * mounted while the URL has already become the destination's (e.g.
 * `/sales/deals`). During that window this `<Routes>` re-renders against the
 * foreign URL, the `*` route matches, and an unconditional `<Navigate>` here
 * fires `replace('/erxes-agent/chat')` — canceling the navigation and stranding
 * the app on a blank page until a manual refresh.
 *
 * Guard against that: only redirect when the current path is genuinely inside
 * this plugin's own base (`defaultPath` minus its last segment). Stray in-plugin
 * paths still normalize to `defaultPath`; foreign paths render nothing and let
 * the subtree unmount cleanly.
 */
const FallbackRedirect = ({ to }: { to: string }) => {
  const { pathname } = useLocation();
  const base = to.slice(0, to.lastIndexOf('/')) || '/';
  if (pathname !== base && !pathname.startsWith(`${base}/`)) return null;
  return <Navigate to={to} replace />;
};

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
        <Route path="*" element={<FallbackRedirect to={defaultPath} />} />
      </Routes>
    </Suspense>
  </PluginErrorBoundary>
);
