import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { useToast } from 'erxes-ui';
import { MASTRA_THREAD_REMOVE } from '~/graphql/mutations';
import { updateThreadsCache } from '~/modules/chat/threadsCache';

interface MastraThreadRemoveResponse {
  mastraThreadRemove: boolean;
}

// Remove a session, optimistically filtering it out of the cached list so it
// disappears from the sidebar instantly (Apollo restores it on error).
export const useRemoveMastraThread = (mastraAgentId?: string) => {
  const { toast } = useToast();
  const [removeThread, { loading }] = useMutation<MastraThreadRemoveResponse>(
    MASTRA_THREAD_REMOVE,
  );

  // Stable identity so callers can pass it into memoized children without
  // breaking their memo on every parent (streamed-token) re-render.
  const mutate = useCallback(
    (threadId: string) =>
      removeThread({
        variables: { threadId },
        optimisticResponse: { mastraThreadRemove: true },
        update: (cache) => {
          if (!mastraAgentId) return;
          updateThreadsCache(cache, mastraAgentId, (list) =>
            list.filter((t) => t.threadId !== threadId),
          );
        },
        onError: (error) => {
          toast({
            title: error?.message || 'Failed to delete session',
            variant: 'destructive',
          });
        },
      }),
    [removeThread, mastraAgentId, toast],
  );

  return { removeThread: mutate, loading };
};
