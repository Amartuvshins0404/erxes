import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { IBlockStatus } from '@/status/types';
import { UPDATE_BLOCK_STATUS } from '@/status/graphql/mutations/updateBlockStatus';
import { GET_BLOCK_STATUSES } from '@/status/graphql/queries/getBlockStatuses';
import { useToast } from 'erxes-ui';

interface UpdateBlockStatusMutationResponse {
  updateBlockOpptyStatus: IBlockStatus;
}

export const useUpdateBlockStatus = () => {
  const { toast } = useToast();
  const [updateStatus, { loading, error }] =
    useMutation<UpdateBlockStatusMutationResponse>(UPDATE_BLOCK_STATUS);

  const handleUpdateStatus = (
    options: MutationFunctionOptions<UpdateBlockStatusMutationResponse, any>,
  ) => {
    updateStatus({
      ...options,
      onCompleted: (data) => {
        options?.onCompleted?.(data);
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
      refetchQueries: [GET_BLOCK_STATUSES],
    });
  };

  return { updateStatus: handleUpdateStatus, loading, error };
};
