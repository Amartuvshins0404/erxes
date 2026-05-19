import { useQuery } from '@apollo/client';
import { GET_SUPPLIER } from '../graphql/queries';

export const useGetSupplier = () => {
  const { data, loading, error, refetch } = useQuery(GET_SUPPLIER);
  return {
    supplier: data?.getSupplier,
    loading,
    error,
    refetch,
  };
};
