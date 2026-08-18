import { QueryHookOptions, useQuery, useSubscription } from '@apollo/client';
import {
  AGENCY_VERIFICATION_STATUS_CHANGED,
  GET_VERIFICATION_STATUS,
} from '../graphql';

export const useVerificationStatus = (options?: QueryHookOptions) => {
  const { data, loading, error, refetch } = useQuery(GET_VERIFICATION_STATUS, {
    fetchPolicy: 'cache-and-network',
    ...options,
  });

  useSubscription(AGENCY_VERIFICATION_STATUS_CHANGED, {
    onData: () => {
      refetch();
    },
  });

  const verificationInfo = data?.getAgencyVerificationStatus || {};

  return {
    verificationInfo,
    loading,
    error,
  };
};
