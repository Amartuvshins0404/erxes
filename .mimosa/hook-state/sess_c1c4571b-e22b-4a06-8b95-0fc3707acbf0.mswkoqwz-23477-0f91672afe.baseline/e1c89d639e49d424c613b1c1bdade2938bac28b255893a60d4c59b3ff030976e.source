import { useMutation } from '@apollo/client';
import { UPDATE_BLOCK_STATUS_ORDER } from '@/status/graphql/mutations/updateBlockStatusOrder';
import { GET_BLOCK_STATUSES } from '@/status/graphql/queries/getBlockStatuses';
import { useToast } from 'erxes-ui';

export const useUpdateBlockStatusOrder = () => {
  const { toast } = useToast();

  const [changeOrder, { loading, error }] = useMutation(
    UPDATE_BLOCK_STATUS_ORDER,
    {
      refetchQueries: [GET_BLOCK_STATUSES],
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
