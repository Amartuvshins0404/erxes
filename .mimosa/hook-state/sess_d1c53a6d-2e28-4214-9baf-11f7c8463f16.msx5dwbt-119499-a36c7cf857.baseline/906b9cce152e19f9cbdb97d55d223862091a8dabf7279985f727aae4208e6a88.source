import { MutationHookOptions, useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { ADD_AGENT } from '../graphql/mutations';
import { GET_AGENTS_LIST } from '../graphql/queries';

export const useAgentAdd = () => {
  const identifierId = useCurrentIdentifierId();
  const [addAgent, { loading }] = useMutation(ADD_AGENT, {
    refetchQueries: [{ query: GET_AGENTS_LIST, variables: { identifierId } }],
  });

  const mutate = async (options: MutationHookOptions<any, any>) => {
    await addAgent({
      context: { timeout: 0 },
      ...options,
      variables: {
        identifierId,
        ...(options.variables || {}),
      },
    });
  };

  return { addAgent: mutate, loading };
};
