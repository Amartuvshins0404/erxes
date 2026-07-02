import { IconCode, IconSparkles } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';

export const AgentNavigation = () => {
  return (
    <>
      <NavigationMenuLinkItem
        name="AI Assistant"
        icon={IconSparkles}
        path="assistant"
        pathPrefix="agent"
      />
      <NavigationMenuLinkItem
        name="AI Agents"
        icon={IconCode}
        path="agents"
        pathPrefix="agent"
      />
    </>
  );
};
