import { IconRobot, IconMessageCircle } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';
import { useHasAnyActivity } from '~/modules/chat/hooks/useChatView';
import { FavoriteAgentItems } from '~/modules/navigation/components/FavoriteAgentItems';

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

// Top-level nav is deliberately just Chat + Agents. Workflows, Schedules,
// Skills and Learnings are no longer global views — they live per-agent inside
// the agent detail page (see AgentDetailPage), scoped to the selected agent.
export const MastraNavigation = () => {
  return (
    <>
      <ChatNavItem />
      <NavigationMenuLinkItem
        name="Agents"
        icon={IconRobot}
        path="erxes-agent/agents"
      />
      <FavoriteAgentItems />
    </>
  );
};
