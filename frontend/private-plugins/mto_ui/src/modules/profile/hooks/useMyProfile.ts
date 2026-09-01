import { useQuery } from '@apollo/client';
import { MTO_MY_PROFILE } from '@/profile/graphql/profileQueries';
import { MtoProfile } from '@/profile/types/profile';

export function useMyProfile(skip = false) {
  const { data, loading, error, refetch } = useQuery(MTO_MY_PROFILE, {
    fetchPolicy: 'cache-and-network',
    skip,
  });

  const profile = (data?.mtoMyProfile ?? null) as MtoProfile | null;

  return { profile, loading, error, refetch };
}
