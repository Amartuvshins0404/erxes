import { useQuery, QueryHookOptions } from '@apollo/client';
import { GET_OPPTY } from '@/oppty/graphql/queries/getOppty';
import { IOppty } from '@/oppty/types/opptyTypes';

export const useGetOppty = (
  options: QueryHookOptions<{ blockGetOppty: IOppty }>,
) => {
  const { data, loading, error } = useQuery<{ blockGetOppty: IOppty }>(
    GET_OPPTY,
    options,
  );

  return {
    oppty: data?.blockGetOppty,
    loading,
    error,
  };
};
