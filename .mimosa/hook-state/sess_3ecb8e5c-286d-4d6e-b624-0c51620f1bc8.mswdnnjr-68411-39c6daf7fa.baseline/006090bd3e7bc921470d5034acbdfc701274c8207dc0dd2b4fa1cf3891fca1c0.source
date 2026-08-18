import { OperationVariables, useMutation } from '@apollo/client';
import { useParams } from 'react-router';
import { GET_OPENCODE } from '../../main/graphql/queries';
import { DEPLOY_OPENCODE } from '../graphql/mutations';

export const useOpencodeDeploy = (identifierId?: string) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const [deploy, { loading }] = useMutation(DEPLOY_OPENCODE, {
    refetchQueries: currentIdentifierId
      ? [{ query: GET_OPENCODE, variables: { identifierId: currentIdentifierId } }]
      : [],
  });

  const deployOpencode = async (
    input: {
      identifierId?: string;
      provider: string;
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
          provider: input.provider,
          apiKey: input.apiToken.trim(),
        },
      },
    });
  };

  return {
    deployOpencode,
    loading,
  };
};
