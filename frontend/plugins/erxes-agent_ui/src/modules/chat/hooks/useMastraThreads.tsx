import { useCallback, useState } from 'react';
import { useQuery } from '@apollo/client';
import { MASTRA_THREADS } from '~/graphql/queries';
import { IMastraThreadsResponse } from '~/modules/chat/types';
import {
  THREADS_PER_PAGE,
  threadsListVars,
} from '~/modules/chat/threadsCache';

// The agent's persisted session list, read from the Apollo cache. The list is
// paginated (newest first) and loaded a page at a time as the sidebar scrolls —
// the initial read costs one page regardless of how many sessions exist, so it
// no longer slows down as a user's history grows. Optimistic create (on send),
// rename, remove, and the turn-end refetch all write into the same cached query
// (keyed by `threadsListVars`), so this stays in sync without a copied array.
export const useMastraThreads = (mastraAgentId?: string) => {
  const { data, loading, fetchMore } = useQuery<IMastraThreadsResponse>(
    MASTRA_THREADS,
    {
      variables: mastraAgentId ? threadsListVars(mastraAgentId) : undefined,
      skip: !mastraAgentId,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    },
  );

  const threads = data?.mastraThreads?.list ?? [];
  const totalCount = data?.mastraThreads?.totalCount ?? 0;
  const hasMore = threads.length < totalCount;

  const [loadingMore, setLoadingMore] = useState(false);

  // Append the next page. Guards keep a fast-firing scroll observer from
  // stacking requests; `fetchMore` merges the page back into the first-page
  // cache entry, deduped by threadId so a re-fired page can't double up.
  const loadMore = useCallback(async () => {
    if (!mastraAgentId || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          agentId: mastraAgentId,
          page: Math.floor(threads.length / THREADS_PER_PAGE) + 1,
          perPage: THREADS_PER_PAGE,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          const more = fetchMoreResult?.mastraThreads;
          if (!more) return prev;
          const prevList = prev?.mastraThreads?.list ?? [];
          const seen = new Set(prevList.map((t) => t.threadId));
          return {
            mastraThreads: {
              ...more,
              list: [
                ...prevList,
                ...(more.list ?? []).filter((t) => !seen.has(t.threadId)),
              ],
            },
          };
        },
      });
    } finally {
      setLoadingMore(false);
    }
  }, [mastraAgentId, loading, loadingMore, hasMore, threads.length, fetchMore]);

  return {
    threads,
    // Only "still loading" before the first read resolves — background refetches
    // (turn end) keep `data`, so the sidebar skeleton never flickers back.
    loading: loading && !data,
    hasMore,
    loadingMore,
    loadMore,
  };
};
