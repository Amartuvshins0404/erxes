import { lazy, type ReactElement } from 'react';
import { Navigate, Route } from 'react-router';
import { PluginRoutesShell } from '~/components/PluginRoutesShell';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import { useAgentAccess } from '~/pages/agents/hooks/useAgentAccess';
import { usePermissionCheck } from 'ui-modules';

const ProvidersPage = lazy(() =>
  import('~/pages/settings/ProvidersPage').then((m) => ({
    default: m.ProvidersPage,
  })),
);

const GeneralSettingsPage = lazy(() =>
  import('~/pages/settings/GeneralSettingsPage').then((m) => ({
    default: m.GeneralSettingsPage,
  })),
);

const PluginToolsPage = lazy(() =>
  import('~/pages/settings/PluginToolsPage').then((m) => ({
    default: m.PluginToolsPage,
  })),
);

const AgentsIndexPage = lazy(() =>
  import('~/pages/agents/AgentsIndexPage').then((m) => ({
    default: m.AgentsIndexPage,
  })),
);

const AgentFormPage = lazy(() =>
  import('~/pages/agents/AgentFormPage').then((m) => ({
    default: m.AgentFormPage,
  })),
);

const AgentDetailPage = lazy(() =>
  import('~/pages/agents/AgentDetailPage').then((m) => ({
    default: m.AgentDetailPage,
  })),
);

const PermissionRoute = ({
  action,
  element,
}: {
  action: string;
  element: ReactElement;
}) => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  if (!isLoaded) return null;
  return hasActionPermission(action) ? (
    element
  ) : (
    <Navigate to="/settings/erxes-agent/providers" replace />
  );
};

const AdminRoute = ({ element }: { element: ReactElement }) => {
  const { isAdmin, isLoaded } = useAgentAccess();
  if (!isLoaded) return null;
  return isAdmin ? (
    element
  ) : (
    <Navigate to="/settings/erxes-agent/providers" replace />
  );
};

export const MastraSettings = () => {
  return (
    <PluginRoutesShell defaultPath="/settings/erxes-agent/agents">
      <Route
        path="/agents"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.agent.readSummary}
            element={<AgentsIndexPage />}
          />
        }
      />
      <Route
        path="/agents/new"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.agent.create}
            element={<AgentFormPage />}
          />
        }
      />
      <Route
        path="/agents/:id/*"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.agent.readConfig}
            element={<AgentDetailPage />}
          />
        }
      />
      <Route path="/providers" element={<ProvidersPage />} />
      <Route
        path="/general"
        element={<AdminRoute element={<GeneralSettingsPage />} />}
      />
      <Route
        path="/plugin-tools"
        element={<AdminRoute element={<PluginToolsPage />} />}
      />
    </PluginRoutesShell>
  );
};
