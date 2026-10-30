import { DocumentNode } from '@apollo/client';
import { useCursorListQuery } from 'erxes-ui';

export const useQuerySelectInputList = (
  query: DocumentNode,
  queryName: string,
  searchValue: string,
  skip?: boolean,
  extraVariables?: Record<string, string | boolean>,
) => {
  const { list, loading, totalCount, handleFetchMore } = useCursorListQuery<
    Record<string, unknown>
  >(query, {
    field: queryName,
    skip,
    variables: {
      ...extraVariables,
      searchValue: searchValue || undefined,
    },
  });

  return {
    list,
    loading,
    totalCount,
    handleFetchMore,
  };
};
