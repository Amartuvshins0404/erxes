import { Sidebar } from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { AgentMark } from '~/modules/chat/components/Avatars';
import { useFavoriteAgents } from '~/modules/navigation/hooks/useFavoriteAgents';

// Favorited agents as an indented sub-list under the "Agents" nav entry.
// Empty favorites render nothing — no empty section.
export const FavoriteAgentsSubmenu = () => {
  const { favoriteAgents } = useFavoriteAgents();
  const { agentId } = useParams<{ agentId: string }>();

  if (favoriteAgents.length === 0) return null;

  return (
    <Sidebar.MenuItem>
      <Sidebar.Sub>
        {favoriteAgents.map((agent) => (
          <Sidebar.SubItem key={agent.agentId}>
            <Sidebar.SubButton asChild isActive={agent.agentId === agentId}>
              <Link to={agent.path}>
                <AgentMark size="sm" className="size-5" />
                <span>{agent.name}</span>
              </Link>
            </Sidebar.SubButton>
          </Sidebar.SubItem>
        ))}
      </Sidebar.Sub>
    </Sidebar.MenuItem>
  );
};
