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

const WorkflowsIndexPage = lazy(() =>
  import('~/pages/workflows/WorkflowsIndexPage').then((m) => ({
    default: m.WorkflowsIndexPage,
  })),
);

const WorkflowDetailPage = lazy(() =>
  import('~/pages/workflows/WorkflowDetailPage').then((m) => ({
    default: m.WorkflowDetailPage,
  })),
);

const WorkflowFormPage = lazy(() =>
  import('~/pages/workflows/WorkflowFormPage').then((m) => ({
    default: m.WorkflowFormPage,
  })),
);

const LearningsIndexPage = lazy(() =>
  import('~/pages/learnings/LearningsIndexPage').then((m) => ({
    default: m.LearningsIndexPage,
  })),
);

const SkillsIndexPage = lazy(() =>
  import('~/modules/skills/components/SkillsIndexPage').then((m) => ({
    default: m.SkillsIndexPage,
  })),
);

const SkillFormPage = lazy(() =>
  import('~/modules/skills/components/SkillFormPage').then((m) => ({
    default: m.SkillFormPage,
  })),
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

const MastraMain = () => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  if (!isLoaded) return null;

  const canChat = hasActionPermission(ERXES_AGENT_ACTIONS.agent.chat);
  const canReadAgents = hasActionPermission(
    ERXES_AGENT_ACTIONS.agent.readSummary,
  );
  const canReadWorkflows = hasActionPermission(
    ERXES_AGENT_ACTIONS.workflow.read,
  );
  const defaultPath = canChat
    ? '/erxes-agent/chat'
    : canReadAgents
    ? '/erxes-agent/agents'
    : canReadWorkflows
    ? '/erxes-agent/workflows'
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
      <Route
        path="/agents/edit/:id"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.agent.update}>
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
      <Route
        path="/workflows"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.workflow.read}>
            <WorkflowsIndexPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/workflows/new"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.workflow.createDraft}>
            <WorkflowFormPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/workflows/edit/:id"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.workflow.updateDraft}>
            <WorkflowFormPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/workflows/:id"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.workflow.read}>
            <WorkflowDetailPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.skills.read}>
            <SkillsIndexPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/skills/new"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.skills.create}>
            <SkillFormPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/skills/edit/:id"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.skills.update}>
            <SkillFormPage />
          </PermissionRoute>
        }
      />
      <Route
        path="/learnings"
        element={
          <PermissionRoute action={ERXES_AGENT_ACTIONS.learning.read}>
            <LearningsIndexPage />
          </PermissionRoute>
        }
      />
    </PluginRoutesShell>
  );
};

export default MastraMain;
