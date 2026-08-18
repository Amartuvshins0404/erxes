import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { GET_ADMIN_LISTING_DETAIL } from '../graphql';
import { IAdminListing } from '../types/listingTypes';

export const useAdminListingDetail = () => {
  const { listingId } = useParams();

  const { data, loading, refetch } = useQuery<{
    getBlockAdminListing: IAdminListing;
  }>(GET_ADMIN_LISTING_DETAIL, {
    variables: { _id: listingId },
    skip: !listingId,
  });

  return { listing: data?.getBlockAdminListing, loading, refetch };
};
