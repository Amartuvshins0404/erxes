import { useQuery } from '@apollo/client';
import { MTO_PROFILE } from '@/profile/graphql/profileQueries';
import { MtoProfile } from '@/profile/types/profile';

export function useProfile(profileId?: string | null) {
  const { data, loading, error, refetch } = useQuery(MTO_PROFILE, {
    variables: { _id: profileId ?? '' },
    skip: !profileId,
    fetchPolicy: 'cache-and-network',
  });

  const profile = (data?.mtoProfile ?? null) as MtoProfile | null;

  return { profile, loading, error, refetch };
}
