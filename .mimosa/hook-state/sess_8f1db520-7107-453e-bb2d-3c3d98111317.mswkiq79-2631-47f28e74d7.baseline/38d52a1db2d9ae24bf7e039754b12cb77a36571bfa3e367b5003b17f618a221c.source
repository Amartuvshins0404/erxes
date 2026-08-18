import { useQuery } from '@apollo/client';
import { GET_COLLECTIVE_PACKAGES } from '../graphql/packageQueries';

export interface ICollectivePackage {
  _id: string;
  name?: string;
  description?: string;
  coverImage?: string;
  collectiveId: string;
  posToken: string;
  productIds?: string[];
  price?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const useCollectivePackages = (variables?: {
  searchValue?: string;
  status?: string;
  limit?: number;
}) => {
  const { data, loading, error, refetch } = useQuery(GET_COLLECTIVE_PACKAGES, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  return {
    packages: (data?.collectivePackages?.list || []) as ICollectivePackage[],
    totalCount: data?.collectivePackages?.totalCount || 0,
    pageInfo: data?.collectivePackages?.pageInfo,
    loading,
    error,
    refetch,
  };
};
