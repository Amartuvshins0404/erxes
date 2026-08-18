import { useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { UPDATE_AGENT_FILE } from '../graphql/mutations';
import { GET_AGENT_DETAILS } from '../graphql/queries';

export const useUpdateAgentFile = (agentId?: string) => {
  const identifierId = useCurrentIdentifierId();
  const [update, { loading }] = useMutation(UPDATE_AGENT_FILE, {
    refetchQueries: [{ query: GET_AGENT_DETAILS, variables: { identifierId, agentId } }],
  });

  const updateFile = async (filename: string, content: string) => {
    await update({
      variables: { identifierId, input: { filename, content, agentId } },
    });
  };

  return { updateFile, loading };
};
