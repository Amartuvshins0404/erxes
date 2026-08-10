import { lazy, type ReactNode } from 'react';
import { Navigate, Route } from 'react-router';
import { PluginRoutesShell } from '~/components/PluginRoutesShell';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

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

const ChatPage = lazy(() =>
  import('~/modules/chat/ChatPage').then((m) => ({ default: m.ChatPage })),
);

const PermissionRoute = ({
  action,
  children,
}: {
  action: string;
  children: ReactNode;
}) => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  if (!isLoaded) return null;
  return hasActionPermission(action) ? children : <Navigate to="/" replace />;
};

export const ErxesAgent = () => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  if (!isLoaded) return null;

  const canChat = hasActionPermission(ERXES_AGENT_ACTIONS.agent.chat);
  const canReadAgents = hasActionPermission(
    ERXES_AGENT_ACTIONS.agent.readSummary,
  );
  const defaultPath = canChat
    ? '/erxes-agent/chat'
    : canReadAgents
    ? '/erxes-agent/agents'
    : '/';

  return (
    <PluginRoutesShell defaultPath={defaultPath}>
      <Route
        path="/chat"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.agent.chat}>
            <ChatPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/chat/:agentId"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.agent.chat}>
            <ChatPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/agents"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.agent.readSummary}>
            <AgentsIndexPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/agents/new"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.agent.create}>
            <AgentFormPage />
          </PermissionRoute>
        }
      />
      {/* Per-agent workspace tabs, each scoped to the selected agent. The
          nested `*` lets AgentDetailPage own its tab sub-routes. */}
      <Route
        path="/agents/:id/*"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.agent.readConfig}>
            <AgentDetailPage />
          </PermissionRoute>
        }
      />
    </PluginRoutesShell>
  );
};
