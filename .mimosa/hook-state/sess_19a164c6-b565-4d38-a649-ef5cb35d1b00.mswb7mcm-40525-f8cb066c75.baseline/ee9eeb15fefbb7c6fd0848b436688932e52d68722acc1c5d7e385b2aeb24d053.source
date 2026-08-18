import { QueryHookOptions, useQuery, useSubscription } from '@apollo/client';
import {
  AGENCY_VERIFICATION_STATUS_CHANGED,
  GET_AGENCY_INFO,
} from '../graphql';

export const useAgencyInfo = (options?: QueryHookOptions) => {
  const { data, error, loading, refetch } = useQuery(GET_AGENCY_INFO, {
    fetchPolicy: 'cache-and-network',
    ...options,
  });

  useSubscription(AGENCY_VERIFICATION_STATUS_CHANGED, {
    onData: () => {
      refetch();
    },
  });

  return {
    agencyInfo: data?.getAgencyInfo,
    error,
    loading,
  };
};
