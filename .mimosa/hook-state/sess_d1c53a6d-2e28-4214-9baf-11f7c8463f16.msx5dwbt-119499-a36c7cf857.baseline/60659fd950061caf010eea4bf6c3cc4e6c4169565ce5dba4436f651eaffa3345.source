import { useQuery } from '@apollo/client';
import { GET_AGENCY_UNIT_STATUS_COUNTS } from '../graphql/queries';
import { IUnitStatusCounts } from '../types/unit';

type Response = { blockAgencyGetUnitStatusCounts: IUnitStatusCounts };

export const useGetUnitStatusCounts = (agencyId?: string) => {
  const { data, loading } = useQuery<Response>(GET_AGENCY_UNIT_STATUS_COUNTS, {
    variables: { agencyId },
    fetchPolicy: 'cache-and-network',
  });

  return {
    counts: data?.blockAgencyGetUnitStatusCounts,
    loading,
  };
};
