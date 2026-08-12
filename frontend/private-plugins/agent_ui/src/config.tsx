import { IUIConfig } from 'erxes-ui';
import { IconCode, IconSparkles } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';

const AgentNavigation = lazy(() =>
  import('./modules/AgentNavigation').then((module) => ({
    default: module.AgentNavigation,
  })),
);

export const CONFIG: IUIConfig = {
  name: 'agent',
  path: 'agent',
  navigationGroup: {
    name: 'Company Brain',
    icon: IconSparkles,
    content: () => (
      <Suspense fallback={<div />}>
        <AgentNavigation />
      </Suspense>
    ),
  },
  modules: [
    {
      name: 'OpenClaw Assistant',
      icon: IconSparkles,
      path: 'agent/assistant',
    },
    {
      name: 'OpenCode Coder',
      icon: IconCode,
      path: 'agent/agents',
    },
    {
      name: 'Company Brain',
      icon: IconSparkles,
      path: 'agent',
    },
  ],
};
