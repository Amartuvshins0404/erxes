import { useMutation } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import { useAuthedListQuery } from '~/hooks/useAuthedListQuery';
import { useChatAgents } from '~/modules/chat/hooks/useChatAgents';
import {
  GET_FAVORITES_BY_CURRENT_USER,
  TOGGLE_FAVORITE,
} from '~/modules/navigation/graphql/favorites';

const FAVORITE_TYPE = 'submenu';
const CHAT_PATH_PREFIX = '/erxes-agent/chat/';

const favoritePath = (agentId: string) => `${CHAT_PATH_PREFIX}${agentId}`;

interface IFavorite {
  _id: string;
  type: string;
  path: string;
  label?: string | null;
}

interface IFavoritesResponse {
  getFavoritesByCurrentUser: IFavorite[] | null;
}

/**
 * Favorited agents for the chat header star.
 *
 * Favorites are core `submenu` records whose path is the agent's chat route and
 * whose `label` is the agent's name — core-ui's global Favorites renderer reads
 * that label to show the agent as an individual sidebar item, so the plugin no
 * longer keeps its own list. We resolve the label at star-time off the chat
 * agents query; ChatPageHeader only mounts the star once the agent is resolved
 * from the loaded list (`hasAgent && agentId`), so the name is always available
 * at click time. The query is gated on auth and degrades silently, so
 * `loading`/`error` are surfaced only for the star button to avoid misreporting
 * state.
 */
export const useFavoriteAgents = () => {
  const { agents } = useChatAgents();

  const { data, loading, error } = useAuthedListQuery<IFavoritesResponse>(
    GET_FAVORITES_BY_CURRENT_USER,
    {
      fetchPolicy: 'cache-and-network',
    },
  );

  const [toggleFavoriteMutation, { loading: toggling }] =
    useMutation(TOGGLE_FAVORITE);

  const favoriteIdSet = useMemo(() => {
    const rows = data?.getFavoritesByCurrentUser ?? [];
    const ids = rows
      .filter(
        (f) => f.type === FAVORITE_TYPE && f.path.startsWith(CHAT_PATH_PREFIX),
      )
      .map((f) => f.path.slice(CHAT_PATH_PREFIX.length))
      .filter(Boolean);
    return new Set(ids);
  }, [data?.getFavoritesByCurrentUser]);

  const isFavorite = useCallback(
    (agentId: string) => favoriteIdSet.has(agentId),
    [favoriteIdSet],
  );

  const toggleFavorite = useCallback(
    (agentId: string) => {
      const label = agents.find((agent) => agent._id === agentId)?.accountName;

      return toggleFavoriteMutation({
        variables: {
          type: FAVORITE_TYPE,
          path: favoritePath(agentId),
          ...(label ? { label } : {}),
        },
        refetchQueries: ['getFavoritesByCurrentUser'],
        awaitRefetchQueries: true,
      });
    },
    [toggleFavoriteMutation, agents],
  );

  return {
    isFavorite,
    toggleFavorite,
    toggling,
    loading,
    error,
  };
};
