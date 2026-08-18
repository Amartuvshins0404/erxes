import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { ONE_FIT_SYSTEM_CONFIG_UPDATE_SELECTED_PAYMENTS } from '../graphql/configMutations';
import { ONE_FIT_SYSTEM_CONFIG_BY_KEY } from '../graphql/configQueries';

export function useUpdateSelectedPayments() {
  const [updateSelectedPaymentsMutation, { loading }] = useMutation(
    ONE_FIT_SYSTEM_CONFIG_UPDATE_SELECTED_PAYMENTS,
  );

  const updateSelectedPayments = (paymentIds: string[]) => {
    return updateSelectedPaymentsMutation({
      variables: { paymentIds },
      refetchQueries: [
        {
          query: ONE_FIT_SYSTEM_CONFIG_BY_KEY,
          variables: { key: 'selectedPayments' },
        },
      ],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Selected payments updated successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { updateSelectedPayments, loading };
}
