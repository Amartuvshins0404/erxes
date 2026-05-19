import { useQuery } from '@apollo/client';
import { GET_COLLECTIVE } from '../graphql/queries';

export const useGetCollective = () => {
  const { data, loading, error, refetch } = useQuery(GET_COLLECTIVE);
  return {
    collective: data?.getCollective,
    loading,
    error,
    refetch,
  };
};
