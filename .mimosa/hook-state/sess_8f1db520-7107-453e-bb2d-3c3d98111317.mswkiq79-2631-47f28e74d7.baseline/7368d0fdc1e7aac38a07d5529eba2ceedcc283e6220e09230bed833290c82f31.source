import { OperationVariables, useMutation } from '@apollo/client';
import { useParams } from 'react-router';
import { GET_AGENT } from '../../main/graphql/queries';
import { DEPLOY_AGENT } from '../graphql/mutations';

export const useAgentDeploy = (identifierId?: string) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const [deploy, { loading }] = useMutation(DEPLOY_AGENT, {
    refetchQueries: currentIdentifierId
      ? [{ query: GET_AGENT, variables: { identifierId: currentIdentifierId } }]
      : [],
  });

  const deployAgent = async (
    input: {
      identifierId?: string;
      token: string;
      provider?: string;
      apiToken: string;
    },
    options?: OperationVariables,
  ) => {
    const nextIdentifierId = input.identifierId || currentIdentifierId;

    if (!nextIdentifierId) {
      throw new Error('identifierId is required');
    }

    await deploy({
      ...(options || {}),
      variables: {
        identifierId: nextIdentifierId,
        input: {
          token: input.token.trim(),
          kimiApiKey: input.apiToken.trim(),
        },
      },
    });
  };

  return {
    deployAgent,
    loading,
  };
};
