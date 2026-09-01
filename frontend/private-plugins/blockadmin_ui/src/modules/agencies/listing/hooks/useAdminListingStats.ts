import { useQuery } from '@apollo/client';
import { IAdminListingStats } from '../types/listingTypes';
import { GET_ADMIN_LISTING_STATS } from '../graphql';

type GetAdminListingStatsResponse = {
  getBlockAdminAgencyListingStats: IAdminListingStats;
};

export const useAdminListingStats = (subdomain?: string) => {
  const { data, loading } = useQuery<GetAdminListingStatsResponse>(
    GET_ADMIN_LISTING_STATS,
    { variables: { subdomain } },
  );
  return { stats: data?.getBlockAdminAgencyListingStats, loading };
};
