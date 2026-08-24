import { useQuery } from '@apollo/client';
import { AGENT_RUNTIME_HEALTH } from '../graphql/queries';

interface AgentRuntimeHealthResult {
  agentRuntimeHealth?: { healthy: boolean } | null;
}

interface UseAgentRuntimeHealthOptions {
  skip?: boolean;
}

// Polls the backend runtime-health probe so the chat surface can gate the
// iframe on a runtime that actually answers, instead of flashing a raw 5xx
// while a pod is recreated. `healthy` is null until the first response lands.
export const useAgentRuntimeHealth = (
  identifierId?: string,
  options?: UseAgentRuntimeHealthOptions,
) => {
  const { data, loading, refetch, startPolling, stopPolling } =
    useQuery<AgentRuntimeHealthResult>(AGENT_RUNTIME_HEALTH, {
      variables: { identifierId },
      skip: options?.skip || !identifierId,
      // Health is volatile; always read from the network, never the cache.
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    });

  return {
    healthy: data?.agentRuntimeHealth?.healthy ?? null,
    loading,
    refetch,
    startPolling,
    stopPolling,
  };
};
