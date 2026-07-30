import { IconCode, IconSparkles } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';
import { LOCKED_MODULES } from '~/modules/locked/lockedModules';

export const AgentNavigation = () => {
  return (
    <>
      <NavigationMenuLinkItem
        name="OpenClaw Assistant"
        icon={IconSparkles}
        path="assistant"
        pathPrefix="agent"
      />
      <NavigationMenuLinkItem
        name="OpenCode Coder"
        icon={IconCode}
        path="agents"
        pathPrefix="agent"
      />
      {LOCKED_MODULES.map((module) => (
        <NavigationMenuLinkItem
          key={module.path}
          name={module.name}
          icon={module.icon}
          path={module.path}
          pathPrefix="agent"
        />
      ))}
    </>
  );
};
