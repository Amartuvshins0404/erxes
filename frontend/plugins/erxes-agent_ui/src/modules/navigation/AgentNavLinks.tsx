import { IconMessageCircle, IconRobot } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

// Flat core-navigation links. The agent/session tree lives in the chat page's
// own sidebar (assistant-ui thread list), so the core sidebar only deep-links
// into the two top-level areas.
export const AgentNavLinks = () => {
  const { hasActionPermission } = usePermissionCheck();

  return (
    <>
      {hasActionPermission(ERXES_AGENT_ACTIONS.agent.chat) && (
        <NavigationMenuLinkItem
          name="Chat"
          icon={IconMessageCircle}
          path="erxes-agent/chat"
        />
      )}
      {hasActionPermission(ERXES_AGENT_ACTIONS.agent.readSummary) && (
        <NavigationMenuLinkItem
          name="Agents"
          icon={IconRobot}
          path="erxes-agent/agents"
        />
      )}
    </>
  );
};
