import { IconRobot } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import type { IUIConfig } from 'erxes-ui';

const MastraSettingsNavigation = lazy(() =>
  import('@/MastraSettingsNavigation').then((module) => ({
    default: module.MastraSettingsNavigation,
  })),
);

const MastraNavigation = lazy(() =>
  import('@/MastraNavigation').then((module) => ({
    default: module.MastraNavigation,
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
    // Display label in the sidebar plugin list (also the group key — only the
    // plugin's own permission name must stay `erxes_agent`).
    name: 'erxes AI Agents',
    icon: IconRobot,
    content: () => (
      <Suspense fallback={<div />}>
        <MastraNavigation />
      </Suspense>
    ),
  },
  modules: [
    {
      // The activity rail uses the first module as its click target and uses
      // module paths to match nested routes back to their owning plugin.
      name: 'erxes AI Agents',
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
