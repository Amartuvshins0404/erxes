import { Sidebar } from 'erxes-ui';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { AgentMark } from '~/modules/chat/components/Avatars';
import { useFavoriteAgents } from '~/modules/navigation/hooks/useFavoriteAgents';

// Favorited agents as flat, top-level items in the plugin's own nav group,
// siblings of the Chat and Agents entries. Empty favorites render nothing.
export const FavoriteAgentItems = () => {
  const { favoriteAgents } = useFavoriteAgents();
  const { pathname } = useLocation();
  const activeAgentId = matchPath('/erxes-agent/chat/:agentId', pathname)?.params
    .agentId;

  if (favoriteAgents.length === 0) return null;

  return (
    <>
      {favoriteAgents.map((agent) => (
        <Sidebar.MenuItem key={agent.agentId}>
          <Sidebar.MenuButton asChild isActive={agent.agentId === activeAgentId}>
            <Link to={agent.path}>
              <AgentMark size="sm" className="size-5" />
              <span>{agent.name}</span>
            </Link>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      ))}
    </>
  );
};
