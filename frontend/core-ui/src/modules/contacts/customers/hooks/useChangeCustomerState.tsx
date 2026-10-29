import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { CUSTOMERS_CHANGE_STATE_BULK } from '@/contacts/customers/graphql/mutations/changeStateBulk';

export const useChangeCustomerState = () => {
  const [_changeStateBulk, { loading }] = useMutation(
    CUSTOMERS_CHANGE_STATE_BULK,
  );

  const changeCustomerState = async (
    _ids: string[],
    value: string,
    options?: Omit<MutationFunctionOptions, 'variables'>,
  ) => {
    await _changeStateBulk({
      ...options,
      variables: { _ids, value },
    });
  };

  return { changeCustomerState, loading };
};
