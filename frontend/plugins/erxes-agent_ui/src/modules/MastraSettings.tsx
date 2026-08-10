import { lazy, type ReactElement } from 'react';
import { Navigate, Route } from 'react-router';
import { PluginRoutesShell } from '~/components/PluginRoutesShell';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

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

const UserQuotasPage = lazy(() =>
  import('~/pages/settings/UserQuotasPage').then((m) => ({
    default: m.UserQuotasPage,
  })),
);

const VoiceSettingsPage = lazy(() =>
  import('~/pages/settings/VoiceSettingsPage').then((m) => ({
    default: m.VoiceSettingsPage,
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
  element,
}: {
  action: string | string[];
  element: ReactElement;
}) => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  if (!isLoaded) return null;
  const isAllowed =
    typeof action === 'string'
      ? hasActionPermission(action)
      : action.some((candidate) => hasActionPermission(candidate));
  return isAllowed ? element : <Navigate to="/" replace />;
};

const MastraSettings = () => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  if (!isLoaded) return null;

  const destinations = [
    {
      action: ERXES_AGENT_ACTIONS.agent.readSummary,
      path: '/settings/erxes-agent/agents',
    },
    {
      action: ERXES_AGENT_ACTIONS.skills.read,
      path: '/settings/erxes-agent/skills',
    },
    {
      action: ERXES_AGENT_ACTIONS.provider.configRead,
      path: '/settings/erxes-agent/providers',
    },
    {
      action: ERXES_AGENT_ACTIONS.settings.statusRead,
      path: '/settings/erxes-agent/general',
    },
    {
      action: ERXES_AGENT_ACTIONS.settings.manage,
      path: '/settings/erxes-agent/general',
    },
    {
      action: ERXES_AGENT_ACTIONS.settings.voiceManage,
      path: '/settings/erxes-agent/voice',
    },
    {
      action: ERXES_AGENT_ACTIONS.settings.quotasManage,
      path: '/settings/erxes-agent/user-quotas',
    },
  ];
  const defaultPath =
    destinations.find(({ action }) => hasActionPermission(action))?.path ?? '/';

  return (
    <PluginRoutesShell defaultPath={defaultPath}>
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
        path="/agents/edit/:id"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.agent.update}
            element={<AgentFormPage />}
          />
        }
      />
      <Route
        path="/skills"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.skills.read}
            element={<SkillsIndexPage />}
          />
        }
      />
      <Route
        path="/skills/new"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.skills.create}
            element={<SkillFormPage />}
          />
        }
      />
      <Route
        path="/skills/edit/:id"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.skills.update}
            element={<SkillFormPage />}
          />
        }
      />
      <Route
        path="/providers"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.provider.configRead}
            element={<ProvidersPage />}
          />
        }
      />
      <Route
        path="/general"
        element={
          <PermissionRoute
            action={[
              ERXES_AGENT_ACTIONS.settings.statusRead,
              ERXES_AGENT_ACTIONS.settings.manage,
            ]}
            element={<GeneralSettingsPage />}
          />
        }
      />
      <Route
        path="/voice"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.settings.voiceManage}
            element={<VoiceSettingsPage />}
          />
        }
      />
      <Route
        path="/user-quotas"
        element={
          <PermissionRoute
            action={ERXES_AGENT_ACTIONS.settings.quotasManage}
            element={<UserQuotasPage />}
          />
        }
      />
    </PluginRoutesShell>
  );
};

export default MastraSettings;
