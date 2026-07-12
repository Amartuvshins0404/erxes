import { DocumentNode, OperationVariables } from '@apollo/client';
import { useAuthedListQuery } from '~/hooks/useAuthedListQuery';

// Network-only resource list fetch with optional variables and lazy skip.
export const useResourceList = <TData, TItem>(
  query: DocumentNode,
  selector: (data?: TData) => TItem[],
  variables?: OperationVariables,
  // Skip the fetch entirely (e.g. a lazily-shown list) so it never runs — and
  // never trips its permission check — until the caller actually needs it.
  skip?: boolean,
) => {
  const { data, loading, error, refetch } = useAuthedListQuery<TData>(query, {
    variables,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    skip,
  });

  return { items: selector(data), loading, error, refetch };
};
