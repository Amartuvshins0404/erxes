import { IconBook2, IconRobot, IconSitemap } from '@tabler/icons-react';
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
      name: 'agents',
      icon: IconRobot,
      path: 'erxes-agent/agents',
    },
    {
      name: 'skills',
      icon: IconBook2,
      path: 'erxes-agent/skills',
    },
    {
      name: 'workflows',
      icon: IconSitemap,
      path: 'erxes-agent/workflows',
      // Advertises that this plugin contributes to the automations builder, so
      // core's RenderPluginsComponentWrapper loads our `automationsWidget`
      // (the "Run agent workflow" action config UI) instead of showing the
      // "Plugin disabled" fallback.
      hasAutomation: true,
    },
  ],
};
