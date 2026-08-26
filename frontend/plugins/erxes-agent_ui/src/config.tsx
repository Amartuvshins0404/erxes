import { IconRobot } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import type { IUIConfig } from 'erxes-ui';

const MastraSettingsNavigation = lazy(() =>
  import('@/MastraSettingsNavigation').then((module) => ({
    default: module.MastraSettingsNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  // MF remote name uses underscores (Nx convention); permissionName is the
  // backend plugin name used for permission checks.
  name: 'erxes_agent',
  permissionName: 'erxes-agent',
  path: 'erxes-agent',
  i18nNamespace: 'mastra',
  settingsNavigation: () => (
    <Suspense fallback={<div />}>
      <MastraSettingsNavigation />
    </Suspense>
  ),
  navigationGroup: {
    // Rail label + icon only. No `content` on purpose: core skips the
    // sub-module panel when a group has no contents, and the plugin renders
    // its own in-page sidebar (agents + conversations) instead.
    name: 'AI Agent',
    defaultPath: 'erxes-agent',
    icon: IconRobot,
  },
  modules: [
    {
      name: 'AI Agent',
      icon: IconRobot,
      path: 'erxes-agent',
    },
    {
      name: 'agents',
      icon: IconRobot,
      path: 'erxes-agent/agents',
    },
  ],
};
