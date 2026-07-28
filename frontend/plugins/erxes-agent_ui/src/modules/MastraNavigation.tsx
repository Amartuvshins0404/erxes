import { IconMessageCircle, IconRobot, IconSitemap } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import { useHasAnyActivity } from '~/modules/chat/hooks/useChatView';

const ChatNavItem = () => {
  // Show dot when any agent is thinking or has an unread AI reply
  const hasAnyUnread = useHasAnyActivity();

  return (
    <div className="relative">
      <NavigationMenuLinkItem
        name="Chat"
        icon={IconMessageCircle}
        path="erxes-agent/chat"
      />
      {hasAnyUnread && (
        <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500 pointer-events-none" />
      )}
    </div>
  );
};

// Only render surfaces granted to the current role; deeper routes enforce the
// same actions independently.
export const MastraNavigation = () => {
  const { hasActionPermission } = usePermissionCheck();
  const canChat = hasActionPermission(ERXES_AGENT_ACTIONS.agent.chat);
  const canReadAgents = hasActionPermission(
    ERXES_AGENT_ACTIONS.agent.readSummary,
  );
  const canReadWorkflows = hasActionPermission(
    ERXES_AGENT_ACTIONS.workflow.read,
  );

  return (
    <>
      {canChat && <ChatNavItem />}
      {canReadAgents && (
        <NavigationMenuLinkItem
          name="Agents"
          icon={IconRobot}
          path="erxes-agent/agents"
        />
      )}
      {canReadWorkflows && (
        <NavigationMenuLinkItem
          name="Workflows"
          icon={IconSitemap}
          path="erxes-agent/workflows"
        />
      )}
    </>
  );
};
