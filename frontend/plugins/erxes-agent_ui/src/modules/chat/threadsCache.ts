import { ApolloCache, ApolloClient } from '@apollo/client';
import { MASTRA_THREADS } from '~/graphql/queries';
import { IMastraThread, IMastraThreadsResponse } from '~/modules/chat/types';

type Client = ApolloClient<object>;
type Cache = ApolloCache<object>;

// How many sessions the sidebar loads per page (newest first). Shared by the
// hook (initial query + fetchMore) and the cache helpers so they all read/write
// the SAME cached query entry.
export const THREADS_PER_PAGE = 30;

// The canonical variables for the session-list query. The list is paginated, but
// Apollo's `fetchMore` merges every loaded page back into the FIRST page's cache
// entry (the one the hook observes). So every cache edit below — and the hook's
// own useQuery — must key off these exact variables, or it would touch a
// different (empty) entry and the edit would silently no-op.
export const threadsListVars = (mastraAgentId: string) => ({
  agentId: mastraAgentId,
  page: 1,
  perPage: THREADS_PER_PAGE,
});

// Write helpers for the cached `mastraThreads` list. The session list lives in
// the Apollo cache (house convention); the chat store reconciles it through
// these instead of owning a copied array. Mutations triggered from the UI use
// the dedicated hooks — these cover the store-driven moments (send / stream
// title / turn end) where there is no GraphQL mutation to hang an update on.

// Single entry point for editing the cached `mastraThreads` list. The recipe
// receives the current list (never null) and returns the next one; returning the
// same reference (or undefined) leaves the cache untouched. `totalCount`, when
// given, overrides the stored total (used by the turn-end refetch, which knows
// the authoritative count); otherwise the total is nudged by the list's length
// delta so an optimistic add (+1) / remove (-1) keeps "load more" accurate.
export const updateThreadsCache = (
  cache: Cache,
  mastraAgentId: string,
  recipe: (threads: IMastraThread[]) => IMastraThread[] | undefined,
  totalCount?: number,
) => {
  cache.updateQuery<IMastraThreadsResponse>(
    { query: MASTRA_THREADS, variables: threadsListVars(mastraAgentId) },
    (prev) => {
      const prevList = prev?.mastraThreads?.list ?? [];
      const next = recipe(prevList);
      if (!next || (next === prevList && totalCount === undefined)) {
        return prev ?? undefined;
      }
      const prevTotal = prev?.mastraThreads?.totalCount ?? prevList.length;
      const nextTotal =
        totalCount ?? Math.max(0, prevTotal + (next.length - prevList.length));
      return {
        mastraThreads: {
          __typename: 'MastraThreadListResponse',
          list: next,
          totalCount: nextTotal,
        },
      };
    },
  );
};

// Surface a brand-new session in the sidebar the instant the first message is
// sent. Idempotent: skips when the thread is already in the list, so a resend
// can't duplicate it. The streamed `thread_title` event and the turn-end
// refetch reconcile the real title / order into the same cached list.
export const prependThreadToCache = (
  client: Client,
  mastraAgentId: string,
  threadId: string,
) => {
  updateThreadsCache(client.cache, mastraAgentId, (list) => {
    if (list.some((t) => t.threadId === threadId)) return undefined;
    const optimistic: IMastraThread = {
      __typename: 'MastraThread',
      _id: threadId,
      threadId,
      title: 'New chat',
      lastMessageAt: null,
      createdAt: null,
    };
    return [optimistic, ...list];
  });
};

// Local title update for the server-pushed `thread_title` stream event (the
// server already persisted it — this only mirrors it into the cached list).
export const setThreadTitleInCache = (
  client: Client,
  mastraAgentId: string,
  threadId: string,
  title: string,
) => {
  updateThreadsCache(client.cache, mastraAgentId, (list) =>
    list.map((t) => (t.threadId === threadId ? { ...t, title } : t)),
  );
};

// Reconcile the cached list against the server after a turn finishes: title,
// ordering, and the real total for the just-created thread. Fetched with
// `no-cache` so it does NOT clobber the cached entry (a plain network read would
// replace the accumulated multi-page list with only the first page); the fresh
// first page is then MERGED in — newest server rows take precedence, any
// already-loaded older pages are kept, and the optimistic entry is replaced by
// its authoritative copy (dedup by threadId).
export const refetchThreadsIntoCache = async (
  client: Client,
  mastraAgentId: string,
) => {
  try {
    const { data } = await client.query<IMastraThreadsResponse>({
      query: MASTRA_THREADS,
      variables: threadsListVars(mastraAgentId),
      fetchPolicy: 'no-cache',
    });
    const fresh = data?.mastraThreads?.list ?? [];
    const total = data?.mastraThreads?.totalCount ?? fresh.length;
    const freshIds = new Set(fresh.map((t) => t.threadId));
    updateThreadsCache(
      client.cache,
      mastraAgentId,
      (existing) => [
        ...fresh,
        ...existing.filter((t) => !freshIds.has(t.threadId)),
      ],
      total,
    );
  } catch {
    // best-effort — the optimistic list stays until the next successful read
  }
};
