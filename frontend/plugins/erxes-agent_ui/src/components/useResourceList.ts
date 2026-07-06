import { DocumentNode, OperationVariables, useQuery } from '@apollo/client';

// Network-only list fetch shared by the schedules and workflows index pages, so
// the table reflects edits. `selector` pulls the row array out of the response.
// `variables` scopes the query (e.g. per-agent lists pass an agentId filter).
export const useResourceList = <TData, TItem>(
  query: DocumentNode,
  selector: (data?: TData) => TItem[],
  variables?: OperationVariables,
  // Skip the fetch entirely (e.g. a lazily-shown list) so it never runs — and
  // never trips its permission check — until the caller actually needs it.
  skip?: boolean,
) => {
  const { data, loading, refetch } = useQuery<TData>(query, {
    variables,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    skip,
  });

  return { items: selector(data), loading, refetch };
};
