import { useMutation, MutationHookOptions } from '@apollo/client';
import { REMOVE_BLOCK_CONTRACT_STATUS } from '@/contract-status/graphql/mutations/removeBlockContractStatus';
import { GET_BLOCK_CONTRACT_STATUSES } from '@/contract-status/graphql/queries/getBlockContractStatuses';
import { useToast } from 'erxes-ui';

export const useDeleteBlockContractStatus = () => {
  const { toast } = useToast();
  const [_removeBlockContractStatus, { loading, error }] = useMutation(
    REMOVE_BLOCK_CONTRACT_STATUS,
  );

  const deleteStatus = (options: MutationHookOptions) => {
    return _removeBlockContractStatus({
      refetchQueries: [GET_BLOCK_CONTRACT_STATUSES],
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
