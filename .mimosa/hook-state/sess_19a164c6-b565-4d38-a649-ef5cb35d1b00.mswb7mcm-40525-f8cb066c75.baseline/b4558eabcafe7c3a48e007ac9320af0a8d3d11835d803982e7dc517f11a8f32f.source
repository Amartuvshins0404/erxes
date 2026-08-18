import { OperationVariables, useMutation } from '@apollo/client';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { APPROVE_AGENT } from '../graphql/mutations';
import { GET_AGENT } from '../../main/graphql/queries';

export const useAgentApprove = () => {
  const identifierId = useCurrentIdentifierId();
  const [approve, { loading, error }] = useMutation(APPROVE_AGENT, {
    refetchQueries: [{ query: GET_AGENT, variables: { identifierId } }],
  });

  const approveAgent = async (code: string, options?: OperationVariables) => {
    await approve({
      ...(options || {}),
      variables: { identifierId, input: { code } },
    });
  };

  return {
    approveAgent,
    loading,
    error,
  };
};
