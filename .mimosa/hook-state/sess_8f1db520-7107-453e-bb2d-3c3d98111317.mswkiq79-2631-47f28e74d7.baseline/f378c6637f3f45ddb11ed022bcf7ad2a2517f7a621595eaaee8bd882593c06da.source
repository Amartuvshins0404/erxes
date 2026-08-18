import { useMutation, MutationHookOptions } from '@apollo/client';
import { REMOVE_BLOCK_STATUS } from '@/status/graphql/mutations/removeBlockStatus';
import { GET_BLOCK_STATUSES } from '@/status/graphql/queries/getBlockStatuses';
import { useToast } from 'erxes-ui';

export const useDeleteBlockStatus = () => {
  const { toast } = useToast();
  const [_removeBlockStatus, { loading, error }] =
    useMutation(REMOVE_BLOCK_STATUS);

  const deleteStatus = (options: MutationHookOptions) => {
    return _removeBlockStatus({
      refetchQueries: [GET_BLOCK_STATUSES],
      onError: (e) => {
        toast({
          title: 'Error',
          description: e.message,
          variant: 'destructive',
        });
      },
      ...options,
    });
  };

  return { deleteStatus, loading, error };
};
