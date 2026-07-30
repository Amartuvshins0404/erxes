import { IconStar } from '@tabler/icons-react';
import { Button, cn } from 'erxes-ui';
import { useFavoriteAgents } from '~/modules/navigation/hooks/useFavoriteAgents';

// Chat-header star that favorites the active agent. Mirrors ui-modules'
// FavoriteToggleIconButton look (outline star, amber-filled when active) but
// drives the agent `submenu` favorite instead of the current-path `module` one.
// Disabled while favorites are loading/errored so it can't misreport state, and
// while a toggle is in flight so a rapid double-click can't fire two flips.
export const AgentFavoriteToggle = ({ agentId }: { agentId: string }) => {
  const { isFavorite, toggleFavorite, toggling, loading, error } =
    useFavoriteAgents();
  const active = isFavorite(agentId);

  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      onClick={() => toggleFavorite(agentId)}
      disabled={loading || toggling || !!error}
      aria-pressed={active}
      aria-label={active ? 'Remove agent from favorites' : 'Favorite agent'}
    >
      <IconStar
        size={16}
        aria-hidden
        className={cn(
          active ? 'text-amber-500 fill-amber-500' : 'opacity-60',
        )}
      />
    </Button>
  );
};
