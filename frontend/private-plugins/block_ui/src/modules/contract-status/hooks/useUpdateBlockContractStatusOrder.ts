import { useMutation } from '@apollo/client';
import { UPDATE_BLOCK_CONTRACT_STATUS_ORDER } from '@/contract-status/graphql/mutations/updateBlockContractStatusOrder';
import { GET_BLOCK_CONTRACT_STATUSES } from '@/contract-status/graphql/queries/getBlockContractStatuses';
import { useToast } from 'erxes-ui';

export const useUpdateBlockContractStatusOrder = () => {
  const { toast } = useToast();

  const [changeOrder, { loading, error }] = useMutation(
    UPDATE_BLOCK_CONTRACT_STATUS_ORDER,
    {
      refetchQueries: [GET_BLOCK_CONTRACT_STATUSES],
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  );

  return { changeOrder, loading, error };
};
