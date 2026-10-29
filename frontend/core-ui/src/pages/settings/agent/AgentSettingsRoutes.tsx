import { Navigate, Route, Routes } from 'react-router';

import { AgentSettingsAppearancePage } from './AgentSettingsAppearancePage';
import { AgentSettingsApprovalsPage } from './AgentSettingsApprovalsPage';
import { AgentSettingsCodeModePage } from './AgentSettingsCodeModePage';

export const AgentSettingsRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="code-mode" replace />} />
      <Route
        path="connection"
        element={<Navigate to="/settings/connections" replace />}
      />
      <Route path="code-mode" element={<AgentSettingsCodeModePage />} />
      <Route path="approvals" element={<AgentSettingsApprovalsPage />} />
      <Route path="appearance" element={<AgentSettingsAppearancePage />} />
    </Routes>
  );
};
