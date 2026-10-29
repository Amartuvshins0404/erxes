import {
  AI_AGENT_AUTOMATIONS_SERVICE,
  isAiAgentProvider,
  TAiAgentProvider,
} from '@/automations/components/settings/components/agents/constants/providers';
import { AUTOMATIONS_AI_AGENT_CONNECTIONS_LIST } from '@/automations/components/settings/components/agents/graphql/automationsAiAgents';
import { useQuery } from '@apollo/client';
import { useMemo } from 'react';

export type TAiAgentConnectionOption = {
  _id: string;
  type: string;
  name: string;
  services: string[];
  secretsSet: string[];
  secretsUnreadable: string[];
};

type TAiAgentConnectionsResponse = {
  connections?: TAiAgentConnectionOption[];
};

export const isConnectionSharedWithAutomations = (
  connection: TAiAgentConnectionOption,
) => connection.services.includes(AI_AGENT_AUTOMATIONS_SERVICE);

export const getConnectionProvider = (
  connection?: TAiAgentConnectionOption,
): TAiAgentProvider | undefined =>
  connection && isAiAgentProvider(connection.type)
    ? connection.type
    : undefined;

export const useAiAgentConnections = () => {
  const { data, loading, error } = useQuery<TAiAgentConnectionsResponse>(
    AUTOMATIONS_AI_AGENT_CONNECTIONS_LIST,
    { fetchPolicy: 'cache-and-network' },
  );

  const connections = useMemo(() => data?.connections || [], [data]);
  const byId = useMemo(
    () => new Map(connections.map((connection) => [connection._id, connection])),
    [connections],
  );

  return {
    connections,
    byId,
    loaded: !!data,
    loading,
    error,
  };
};
