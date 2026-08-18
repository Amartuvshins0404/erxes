import { OperationVariables, useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../../assistant-orgs/hooks/useAssistantOrg';
import { GET_OPENCODE } from '../../main/graphql/queries';
import { DESTROY_OPENCODE } from '../graphql/mutations';

export const useOpencodeDestroy = () => {
  const identifierId = useCurrentIdentifierId();
  const [destroy, { loading, error }] = useMutation(DESTROY_OPENCODE, {
    refetchQueries: [{ query: GET_OPENCODE, variables: { identifierId } }],
  });

  const destroyOpencode = async (options?: OperationVariables) => {
    await destroy({ ...(options || {}), variables: { identifierId } });
  };

  return {
    destroyOpencode,
    loading,
    error,
  };
};
