import { OperationVariables, useMutation } from '@apollo/client';
import { BROADCAST_COPY } from '../graphql/mutations';

export const useBroadcastCopy = () => {
  const [_copyBroadcast, { loading }] = useMutation(BROADCAST_COPY);

  const copyBroadcast = async (
    broadcastId: string,
    options?: OperationVariables,
  ) => {
    await _copyBroadcast({
      ...options,
      variables: { _id: broadcastId },
    });
  };

  return { copyBroadcast, loading };
};
