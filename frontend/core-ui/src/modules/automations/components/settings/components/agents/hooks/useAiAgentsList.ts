import {
  getConnectionProvider,
  useAiAgentConnections,
} from '@/automations/components/settings/components/agents/hooks/useAiAgentConnections';
import { useAiAgents } from '@/automations/components/settings/components/agents/hooks/useAiAgents';
import { useMultiQueryState } from 'erxes-ui';
import { useMemo } from 'react';

export const useAiAgentsList = () => {
  const [{ kind, searchValue }] = useMultiQueryState<{
    kind: string;
    searchValue: string;
  }>(['kind', 'searchValue']);
  const { automationsAiAgents, loading } = useAiAgents();
  const { byId, loading: connectionsLoading } = useAiAgentConnections();
  const query = searchValue?.trim().toLowerCase();

  const agents = useMemo(
    () =>
      automationsAiAgents
        .map((agent) => ({
          ...agent,
          connection: {
            ...agent.connection,
            provider: getConnectionProvider(
              byId.get(agent.connection?.connectionId || ''),
            ),
          },
        }))
        .filter(
          (agent) => !kind || agent.connection.provider === kind,
        )
        .filter(
          (agent) => !query || agent.name?.toLowerCase().includes(query),
        ),
    [automationsAiAgents, byId, kind, query],
  );

  return {
    agents,
    totalCount: agents.length,
    loading: loading || (!!kind && connectionsLoading),
    kind,
  };
};
