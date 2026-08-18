import { useQuery } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { GET_AGENT_DETAILS } from '../graphql/queries';

export interface AgentFile {
  fileName: string;
  content: string;
}

export const useAgentDetails = (agentId: string | null) => {
  const identifierId = useCurrentIdentifierId();
  const { data, loading, refetch } = useQuery(GET_AGENT_DETAILS, {
    variables: { identifierId, agentId },
    skip: !agentId,
  });

  return {
    files: (data?.getAgentDetails ?? []) as AgentFile[],
    loading,
    refetch,
  };
};
