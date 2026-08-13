import type { ApolloClient } from '@apollo/client';
import type { unstable_RemoteThreadListAdapter as RemoteThreadListAdapter } from '@assistant-ui/react';
import { MASTRA_THREADS } from '~/graphql/queries';
import {
  MASTRA_THREAD_REMOVE,
  MASTRA_THREAD_RENAME,
} from '~/graphql/mutations';
import type { IMastraThreadsResponse } from '~/modules/chat/types';
import { chatStore } from '~/modules/chat/store/chatStore';
import {
  setThreadTitleInCache,
  threadsListVars,
  updateThreadsCache,
} from '~/modules/chat/threadsCache';

type Client = ApolloClient<object>;

// AssistantStream chunk type, derived from the adapter contract so the plugin
// doesn't import the transitive `assistant-stream` package directly.
type TitleStream = Awaited<ReturnType<RemoteThreadListAdapter['generateTitle']>>;
type TitleChunk = TitleStream extends ReadableStream<infer C> ? C : never;

// One-shot stream carrying a single text part (the generated title), or an
// empty stream when the backend hasn't persisted one yet.
const titleStream = (title: string | undefined): TitleStream =>
  new ReadableStream<TitleChunk>({
    start(controller) {
      if (title) {
        controller.enqueue({
          path: [],
          type: 'part-start',
          part: { type: 'text' },
        } as TitleChunk);
        controller.enqueue({
          path: [0],
          type: 'text-delta',
          textDelta: title,
        } as TitleChunk);
        controller.enqueue({ path: [], type: 'part-finish' } as TitleChunk);
      }
      controller.close();
    },
  }) as TitleStream;

// Read the server's persisted title for a thread (the backend auto-titles
// during the first turn). `no-cache` so the read reflects the just-finished
// turn, and the result is also mirrored into the cached session list.
const fetchPersistedTitle = async (
  client: Client,
  mastraAgentId: string,
  threadId: string,
): Promise<string | undefined> => {
  try {
    const { data } = await client.query<IMastraThreadsResponse>({
      query: MASTRA_THREADS,
      variables: threadsListVars(mastraAgentId),
      fetchPolicy: 'no-cache',
    });
    const title = data?.mastraThreads?.list?.find(
      (t) => t.threadId === threadId,
    )?.title;
    if (title) setThreadTitleInCache(client, mastraAgentId, threadId, title);
    return title || undefined;
  } catch {
    return undefined;
  }
};

// assistant-ui remote-thread-list adapter backed by the mastra session
// GraphQL contract. Thread ids are client-generated and the backend persists
// a thread on its first message, so `initialize` is a pure id passthrough —
// the local id the runtime generated IS the remote id. Archiving has no
// backend counterpart and is rejected (the UI never offers it).
export const createMastraThreadListAdapter = (
  client: Client,
  agentKey: string,
  mastraAgentId: string,
): RemoteThreadListAdapter => ({
  list: async () => {
    const { data } = await client.query<IMastraThreadsResponse>({
      query: MASTRA_THREADS,
      variables: threadsListVars(mastraAgentId),
      fetchPolicy: 'network-only',
    });
    return {
      threads: (data?.mastraThreads?.list ?? []).map((thread) => ({
        status: 'regular' as const,
        remoteId: thread.threadId,
        title: thread.title || undefined,
      })),
    };
  },

  fetch: async (threadId) => {
    // Deep-link target outside the loaded first page: the runtime only needs
    // identity + status; the title reconciles from the list/messages queries.
    const title = await fetchPersistedTitle(client, mastraAgentId, threadId);
    return { status: 'regular' as const, remoteId: threadId, title };
  },

  initialize: async (threadId) => ({
    remoteId: threadId,
    externalId: undefined,
  }),

  rename: async (remoteId, newTitle) => {
    await client.mutate({
      mutation: MASTRA_THREAD_RENAME,
      variables: { threadId: remoteId, title: newTitle },
    });
    setThreadTitleInCache(client, mastraAgentId, remoteId, newTitle);
  },

  delete: async (remoteId) => {
    await client.mutate({
      mutation: MASTRA_THREAD_REMOVE,
      variables: { threadId: remoteId },
    });
    updateThreadsCache(client.cache, mastraAgentId, (list) =>
      list.filter((t) => t.threadId !== remoteId),
    );
    chatStore.discardThread(agentKey, remoteId);
  },

  archive: async () => {
    throw new Error('Archiving conversations is not supported');
  },

  unarchive: async () => {
    throw new Error('Archiving conversations is not supported');
  },

  generateTitle: async (remoteId) =>
    titleStream(await fetchPersistedTitle(client, mastraAgentId, remoteId)),
});
