import { OperationVariables, useMutation } from '@apollo/client';
import { BROADCAST_REMOVE } from '../graphql/mutations';

export const useBroadcastRemove = () => {
  const [_removeBroadcast, { loading }] = useMutation(BROADCAST_REMOVE);

  const removeBroadcast = async (
    broadcastIds: string[],
    options?: OperationVariables,
  ) => {
    await _removeBroadcast({
      ...options,
      variables: { _ids: broadcastIds, ...options?.variables },
    });
  };

  return { removeBroadcast, loading };
};
