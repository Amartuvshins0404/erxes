import { useQuery } from '@apollo/client';
import { GET_COLLECTIVE_PACKAGE_DETAIL } from '../graphql/packageQueries';
import { ICollectivePackage } from './useCollectivePackages';

export const useCollectivePackageDetail = (id?: string | null) => {
  const { data, loading, error, refetch } = useQuery(
    GET_COLLECTIVE_PACKAGE_DETAIL,
    {
      variables: { _id: id },
      skip: !id,
      fetchPolicy: 'cache-and-network',
    },
  );

  return {
    package: (data?.collectivePackageDetail || null) as ICollectivePackage | null,
    loading,
    error,
    refetch,
  };
};
