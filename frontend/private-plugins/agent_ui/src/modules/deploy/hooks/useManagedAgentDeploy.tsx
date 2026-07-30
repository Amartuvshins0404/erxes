import { OperationVariables, useMutation } from '@apollo/client';
import { useParams } from 'react-router';
import { GET_AGENT } from '../../main/graphql/queries';
import { DEPLOY_MANAGED_AGENT } from '../graphql/mutations';

interface ManagedAgentDeployResult {
  deployManagedAgent?: {
    status?: string;
    url?: string | null;
  } | null;
}

export const useManagedAgentDeploy = (identifierId?: string) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const [deploy, { loading }] = useMutation<ManagedAgentDeployResult>(
    DEPLOY_MANAGED_AGENT,
    {
      refetchQueries: currentIdentifierId
        ? [
            {
              query: GET_AGENT,
              variables: { identifierId: currentIdentifierId },
            },
          ]
        : [],
    },
  );

  const deployManagedAgent = async (
    input: {
      identifierId?: string;
      provider?: string;
      apiToken: string;
      description?: string;
      systemPrompt?: string;
    },
    options?: OperationVariables,
  ) => {
    const nextIdentifierId = input.identifierId || currentIdentifierId;

    if (!nextIdentifierId) {
      throw new Error('identifierId is required');
    }

    const { data } = await deploy({
      ...(options || {}),
      variables: {
        identifierId: nextIdentifierId,
        input: {
          provider: input.provider || 'kimi',
          kimiApiKey: input.apiToken.trim(),
          description: input.description?.trim() || undefined,
          systemPrompt: input.systemPrompt?.trim() || undefined,
        },
      },
    });

    return data?.deployManagedAgent ?? null;
  };

  return {
    deployManagedAgent,
    loading,
  };
};
