import { useQuery } from '@apollo/client';
import { ONE_FIT_SUGGESTED_INSTANCE_ID } from '../graphql/mtoModeQueries';

export function useMtoSuggestedInstanceId() {
  const { data, loading, error } = useQuery(ONE_FIT_SUGGESTED_INSTANCE_ID, {
    fetchPolicy: 'cache-and-network',
  });

  const suggestedInstanceId = data?.mtoSuggestedInstanceId as
    | string
    | null
    | undefined;

  return {
    suggestedInstanceId:
      suggestedInstanceId && suggestedInstanceId.trim() !== ''
        ? suggestedInstanceId
        : null,
    loading,
    error,
  };
}
