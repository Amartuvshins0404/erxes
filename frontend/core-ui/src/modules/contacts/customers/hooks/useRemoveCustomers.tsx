import { OperationVariables, useMutation } from '@apollo/client';
import { CUSTOMERS_REMOVE } from '@/contacts/customers/graphql/mutations/removeCustomers';

export const useRemoveCustomers = () => {
  const [_removeCustomers, { loading }] = useMutation(CUSTOMERS_REMOVE);

  const removeCustomers = async (
    customerIds: string[],
    options?: OperationVariables,
  ) => {
    await _removeCustomers({
      ...options,
      variables: { customerIds, ...options?.variables },
    });
  };

  return { removeCustomers, loading };
};
