import { lazy, type ReactElement } from 'react';
import { Navigate, Route } from 'react-router';
import { PluginRoutesShell } from '~/components/PluginRoutesShell';
import { useAgentAccess } from '~/pages/agents/hooks/useAgentAccess';

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

const AdminRoute = ({ element }: { element: ReactElement }) => {
  const { isAdmin, isLoaded } = useAgentAccess();
  if (!isLoaded) return null;
  return isAdmin ? element : <Navigate to="/settings/erxes-agent/agents" replace />;
};

const MastraSettings = () => {
  return (
    <PluginRoutesShell defaultPath="/settings/erxes-agent/agents">
      <Route path="/agents" element={<AgentsIndexPage />} />
      <Route path="/agents/new" element={<AgentFormPage />} />
      <Route path="/agents/edit/:id" element={<AgentFormPage />} />
      <Route path="/skills" element={<SkillsIndexPage />} />
      <Route path="/skills/new" element={<SkillFormPage />} />
      <Route path="/skills/edit/:id" element={<SkillFormPage />} />
      <Route path="/providers" element={<AdminRoute element={<ProvidersPage />} />} />
      <Route path="/general" element={<AdminRoute element={<GeneralSettingsPage />} />} />
      <Route path="/voice" element={<AdminRoute element={<VoiceSettingsPage />} />} />
      <Route path="/user-quotas" element={<AdminRoute element={<UserQuotasPage />} />} />
    </PluginRoutesShell>
  );
};

export default MastraSettings;
