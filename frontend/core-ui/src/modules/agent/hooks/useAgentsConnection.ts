import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useCallback, useMemo } from 'react';

import {
  AGENTS_AI_CONNECTIONS,
  AGENTS_MODELS,
  AGENTS_SET_DEFAULT_CONNECTION,
} from '../graphql/connection';
import type {
  IAgentsAiConnection,
  IAgentsAiConnectionsData,
  IAgentsSetDefaultConnectionData,
  IAgentsSetDefaultConnectionVariables,
} from '../graphql/connection';

export interface IUseAgentsConnectionResult {
  connections: IAgentsAiConnection[];
  loading: boolean;
  error: string | undefined;
  refetch: () => Promise<void>;
}

export const useAgentsConnection = (): IUseAgentsConnectionResult => {
  const { data, loading, error, refetch } = useQuery<IAgentsAiConnectionsData>(
    AGENTS_AI_CONNECTIONS,
  );

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const connections = useMemo(
    () =>
      (data?.connections ?? []).filter(
        (connection) => connection.secretsUnreadable.length === 0,
      ),
    [data],
  );

  return {
    connections,
    loading,
    error: error?.message,
    refetch: handleRefetch,
  };
};

export const useAgentsSetDefaultConnection = (): ((
  connectionId: string,
) => Promise<void>) => {
  const [setDefault] = useMutation<
    IAgentsSetDefaultConnectionData,
    IAgentsSetDefaultConnectionVariables
  >(AGENTS_SET_DEFAULT_CONNECTION, {
    refetchQueries: [{ query: AGENTS_MODELS }],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (connectionId: string) => {
      try {
        await setDefault({ variables: { connectionId } });
        toast({ title: 'Default connection updated' });
      } catch (error: unknown) {
        toast({
          title: 'Failed to set the default connection',
          description: error instanceof Error ? error.message : undefined,
          variant: 'destructive',
        });
      }
    },
    [setDefault],
  );
};
