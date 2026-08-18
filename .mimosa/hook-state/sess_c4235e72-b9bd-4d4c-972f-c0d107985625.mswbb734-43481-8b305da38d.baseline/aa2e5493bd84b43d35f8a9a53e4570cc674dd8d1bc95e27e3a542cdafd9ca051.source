import { useQuery } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { GET_AGENTS_LIST } from '../graphql/queries';

export interface AgentListItem {
  id: string;
  identity: Record<string, unknown> | null;
}

export const useAgentsList = () => {
  const identifierId = useCurrentIdentifierId();
  const { data, loading, refetch } = useQuery(GET_AGENTS_LIST, {
    variables: { identifierId },
  });

  return {
    agents: (data?.getAgentsList ?? []) as AgentListItem[],
    loading,
    refetch,
  };
};
