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
}

interface IFavoritesResponse {
  getFavoritesByCurrentUser: IFavorite[] | null;
}

export interface IFavoriteAgent {
  agentId: string;
  name: string;
  path: string;
}

/**
 * Favorited agents for the plugin's own sidebar submenu + the chat header star.
 *
 * Favorites are core `submenu` records whose path is the agent's chat route; we
 * keep only ours (path under `/erxes-agent/chat/`) and resolve display names off
 * the chat agents query so no extra backend call is needed. The list is a
 * non-critical decoration — the query is gated on auth and degrades silently, so
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

  const favoriteIds = useMemo(() => {
    const rows = data?.getFavoritesByCurrentUser ?? [];
    return rows
      .filter(
        (f) => f.type === FAVORITE_TYPE && f.path.startsWith(CHAT_PATH_PREFIX),
      )
      .map((f) => f.path.slice(CHAT_PATH_PREFIX.length))
      .filter(Boolean);
  }, [data?.getFavoritesByCurrentUser]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const favoriteAgents = useMemo<IFavoriteAgent[]>(
    () =>
      favoriteIds.reduce<IFavoriteAgent[]>((acc, agentId) => {
        const agent = agents.find(
          (a) => a._id === agentId || a.agentId === agentId,
        );
        if (agent) {
          acc.push({ agentId, name: agent.name, path: favoritePath(agentId) });
        }
        return acc;
      }, []),
    [favoriteIds, agents],
  );

  const isFavorite = useCallback(
    (agentId: string) => favoriteIdSet.has(agentId),
    [favoriteIdSet],
  );

  const toggleFavorite = useCallback(
    (agentId: string) =>
      toggleFavoriteMutation({
        variables: { type: FAVORITE_TYPE, path: favoritePath(agentId) },
        refetchQueries: ['getFavoritesByCurrentUser'],
        awaitRefetchQueries: true,
      }),
    [toggleFavoriteMutation],
  );

  return {
    favoriteAgents,
    isFavorite,
    toggleFavorite,
    toggling,
    loading,
    error,
  };
};
