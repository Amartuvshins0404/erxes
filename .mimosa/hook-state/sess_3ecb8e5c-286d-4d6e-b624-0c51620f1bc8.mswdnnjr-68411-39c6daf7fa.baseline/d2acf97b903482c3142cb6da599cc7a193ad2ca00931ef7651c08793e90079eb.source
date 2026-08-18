import { useQuery } from '@apollo/client';
import { GET_LISTING_STATS } from '../graphql';

type ListingStats = {
  total: number;
  active: number;
  draft: number;
  totalViews: number;
};

export const useListingStats = () => {
  const { data, loading } = useQuery<{ blockGetListingStats: ListingStats }>(
    GET_LISTING_STATS,
  );

  return { stats: data?.blockGetListingStats, loading };
};
