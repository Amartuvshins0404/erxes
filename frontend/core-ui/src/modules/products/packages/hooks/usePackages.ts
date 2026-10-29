import { useCursorListQuery } from 'erxes-ui';
import { GET_PACKAGES } from '../graphql/packageQueries';
import { IPackage } from '../types/Package';

export const usePackages = (variables?: {
  searchValue?: string;
  status?: string;
  tagIds?: string[];
}) => {
  const { list, ...rest } = useCursorListQuery<IPackage>(GET_PACKAGES, {
    field: 'productPackages',
    variables,
    fetchPolicy: 'cache-and-network',
  });

  return {
    packages: list,
    ...rest,
    loading: rest.initialLoading,
  };
};
