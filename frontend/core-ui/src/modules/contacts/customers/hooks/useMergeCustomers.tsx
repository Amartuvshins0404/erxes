import { OperationVariables, useMutation } from '@apollo/client';
import { CUSTOMERS_MERGE_MUTATION } from '../graphql/mutations/mergeCustomers';

interface ICustomerMergeData {
  customersMerge: { _id: string } | null;
}

export const useMergeCustomers = () => {
  const [_mergeCustomers, { loading, error }] = useMutation<ICustomerMergeData>(
    CUSTOMERS_MERGE_MUTATION,
  );

  const mergeCustomers = (options?: OperationVariables) => {
    const mergedIds: string[] = options?.variables?.customerIds || [];

    return _mergeCustomers({
      ...options,
      update: (cache, { data }) => {
        const keptId = data?.customersMerge?._id;

        mergedIds
          .filter((id) => id !== keptId)
          .forEach((id) =>
            cache.evict({
              id: cache.identify({ __typename: 'Customer', _id: id }),
            }),
          );
        cache.gc();
      },
    });
  };

  return { mergeCustomers, loading, error };
};
