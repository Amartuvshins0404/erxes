import { OperationVariables, useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { GET_AGENT } from '../../main/graphql/queries';
import { DESTROY_AGENT } from '../graphql/mutations';

export const useAgentDestroy = () => {
  const identifierId = useCurrentIdentifierId();
  const [destroy, { loading, error }] = useMutation(DESTROY_AGENT, {
    refetchQueries: [{ query: GET_AGENT, variables: { identifierId } }],
  });

  const destroyAgent = async (options?: OperationVariables) => {
    await destroy({ ...(options || {}), variables: { identifierId } });
  };

  return {
    destroyAgent,
    loading,
    error,
  };
};
