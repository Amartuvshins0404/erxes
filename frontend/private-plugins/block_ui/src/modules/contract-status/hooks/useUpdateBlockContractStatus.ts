import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { IBlockContractStatus } from '@/contract-status/types';
import { UPDATE_BLOCK_CONTRACT_STATUS } from '@/contract-status/graphql/mutations/updateBlockContractStatus';
import { GET_BLOCK_CONTRACT_STATUSES } from '@/contract-status/graphql/queries/getBlockContractStatuses';
import { useToast } from 'erxes-ui';

interface UpdateBlockContractStatusMutationResponse {
  updateBlockContractStatus: IBlockContractStatus;
}

export const useUpdateBlockContractStatus = () => {
  const { toast } = useToast();
  const [updateStatus, { loading, error }] =
    useMutation<UpdateBlockContractStatusMutationResponse>(
      UPDATE_BLOCK_CONTRACT_STATUS,
    );

  const handleUpdateStatus = (
    options: MutationFunctionOptions<
      UpdateBlockContractStatusMutationResponse,
      any
    >,
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
      refetchQueries: [GET_BLOCK_CONTRACT_STATUSES],
    });
  };

  return { updateStatus: handleUpdateStatus, loading, error };
};
