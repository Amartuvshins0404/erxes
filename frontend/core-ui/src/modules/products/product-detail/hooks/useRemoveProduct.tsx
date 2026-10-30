import { MutationHookOptions, useMutation } from '@apollo/client';
import { productsRemoveMutation } from '../graphql/mutations/ProductRemoveMutations';

export const useRemoveProducts = () => {
  const [_removeProducts, { loading }] = useMutation(
    productsRemoveMutation.productRemove,
  );

  const removeProducts = async (
    productIds: string[],
    options?: MutationHookOptions,
  ) => {
    await _removeProducts({
      ...options,
      variables: { productIds, ...options?.variables },
    });
  };

  return { removeProducts, loading };
};
