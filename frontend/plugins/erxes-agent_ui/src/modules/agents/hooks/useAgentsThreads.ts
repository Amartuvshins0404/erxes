import { useQuery } from '@apollo/client';
import { useCallback, useEffect, useRef } from 'react';

import {
  AGENTS_THREADS,
  AGENTS_THREADS_CHANGED,
} from '../graphql/threads';
import type { IAgentsThreadsData } from '../graphql/threads';
import type { IAgentsThread } from '../types';

export interface IUseAgentsThreadsResult {
  threads: IAgentsThread[];
  loading: boolean;
  error: string | undefined;
  refetch: () => Promise<void>;
}

/**
 * Loads the acting user's agents threads. The `agentsThreadsChanged`
 * subscription is used purely as a refetch signal: whenever a chat turn is
 * persisted or a thread title is generated server-side, a debounced refetch
 * keeps the list fresh without any manual refresh.
 */
export const useAgentsThreads = (): IUseAgentsThreadsResult => {
  const refetchTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data, loading, error, refetch, subscribeToMore } =
    useQuery<IAgentsThreadsData>(AGENTS_THREADS, {
      variables: { page: 1, perPage: 50 },
    });

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: AGENTS_THREADS_CHANGED,
      updateQuery: (prev, { subscriptionData }) => {
        if (subscriptionData.data) {
          if (refetchTimer.current) {
            clearTimeout(refetchTimer.current);
          }

          refetchTimer.current = setTimeout(() => {
            void refetch();
          }, 500);
        }

        return prev;
      },
    });

    return () => {
      if (refetchTimer.current) {
        clearTimeout(refetchTimer.current);
      }

      unsubscribe();
    };
  }, [refetch, subscribeToMore]);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    threads: data?.agentsThreads?.threads ?? [],
    loading,
    error: error?.message,
    refetch: handleRefetch,
  };
};
