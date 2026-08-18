import { OperationVariables, useMutation } from '@apollo/client';
import { useParams } from 'react-router';
import { GET_AGENT } from '../../main/graphql/queries';
import { TRANSFER_AGENT } from '../graphql/mutations';

export const useAgentTransfer = (identifierId?: string) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const [transfer, { loading }] = useMutation(TRANSFER_AGENT, {
    refetchQueries: currentIdentifierId
      ? [{ query: GET_AGENT, variables: { identifierId: currentIdentifierId } }]
      : [],
  });

  const transferAgent = async (
    input: {
      identifierId?: string;
      serverName: string;
      gatewayToken: string;
      serverUrl?: string;
      agentId?: string;
      serverId?: string;
      sourceSubdomain?: string;
    },
    options?: OperationVariables,
  ) => {
    const nextIdentifierId = input.identifierId || currentIdentifierId;

    if (!nextIdentifierId) {
      throw new Error('identifierId is required');
    }

    await transfer({
      ...(options || {}),
      variables: {
        identifierId: nextIdentifierId,
        input: {
          serverName: input.serverName.trim(),
          gatewayToken: input.gatewayToken.trim(),
          serverUrl: input.serverUrl?.trim() || undefined,
          agentId: input.agentId?.trim() || undefined,
          serverId: input.serverId?.trim() || undefined,
          sourceSubdomain: input.sourceSubdomain?.trim() || undefined,
        },
      },
    });
  };

  return { transferAgent, loading };
};
