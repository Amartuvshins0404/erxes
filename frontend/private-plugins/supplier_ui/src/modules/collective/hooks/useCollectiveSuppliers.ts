import { useQuery } from '@apollo/client';
import { GET_COLLECTIVE_SUPPLIERS } from '../graphql/queries';

export const useCollectiveSuppliers = () => {
  const { data, loading, error, refetch } = useQuery(GET_COLLECTIVE_SUPPLIERS);
  return {
    suppliers: data?.collectiveSuppliers || [],
    loading,
    error,
    refetch,
  };
};
