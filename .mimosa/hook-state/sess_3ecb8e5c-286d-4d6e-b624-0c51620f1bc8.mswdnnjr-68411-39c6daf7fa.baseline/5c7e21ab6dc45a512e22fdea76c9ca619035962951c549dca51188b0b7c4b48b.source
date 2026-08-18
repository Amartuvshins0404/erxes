import { OperationVariables, useMutation } from '@apollo/client';
import { useParams } from 'react-router';
import { GET_OPENCODE } from '../../main/graphql/queries';
import { TRANSFER_OPENCODE } from '../graphql/mutations';

export const useOpencodeTransfer = (identifierId?: string) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const [transfer, { loading }] = useMutation(TRANSFER_OPENCODE, {
    refetchQueries: currentIdentifierId
      ? [{ query: GET_OPENCODE, variables: { identifierId: currentIdentifierId } }]
      : [],
  });

  const transferOpencode = async (
    input: {
      identifierId?: string;
      serverName: string;
      gatewayToken: string;
      provider: string;
      serverUrl: string;
      serverId?: string;
      serverPassword?: string;
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
          provider: input.provider.trim(),
          serverUrl: input.serverUrl.trim(),
          serverId: input.serverId?.trim() || undefined,
          serverPassword: input.serverPassword?.trim() || undefined,
          sourceSubdomain: input.sourceSubdomain?.trim() || undefined,
        },
      },
    });
  };

  return { transferOpencode, loading };
};
