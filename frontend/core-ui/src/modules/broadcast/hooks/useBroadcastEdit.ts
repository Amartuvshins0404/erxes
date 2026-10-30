import {
  MutationHookOptions,
  OperationVariables,
  useMutation,
} from '@apollo/client';
import { BROADCAST_MESSAGE_EDIT } from '../graphql/mutations';
import { BROADCAST_MESSAGE, BROADCAST_MESSAGES } from '../graphql/queries';

export const useBroadcastEdit = () => {
  const [mutate, { loading }] = useMutation(BROADCAST_MESSAGE_EDIT);

  const editBroadcast = ({
    variables,
    ...options
  }: MutationHookOptions<
    { engageMessageEdit: { _id: string; workflowAutomationId?: string } },
    OperationVariables
  >) =>
    mutate({
      ...options,
      variables,
      refetchQueries: [BROADCAST_MESSAGES, BROADCAST_MESSAGE],
    });

  return { editBroadcast, loading };
};
