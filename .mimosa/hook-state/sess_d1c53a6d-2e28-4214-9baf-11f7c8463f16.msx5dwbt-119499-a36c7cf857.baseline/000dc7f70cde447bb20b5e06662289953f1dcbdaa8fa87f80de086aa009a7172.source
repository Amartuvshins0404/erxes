import { useQuery } from '@apollo/client';
import { GET_LISTING_DETAIL } from '../graphql';
import { IListing } from '../types/listing';

type GetListingDetailResponse = {
  blockGetListing: IListing & { _id: string };
};

export const useGetListingDetail = (_id: string | undefined) => {
  const { data, loading } = useQuery<GetListingDetailResponse>(
    GET_LISTING_DETAIL,
    { variables: { _id }, skip: !_id },
  );

  return { listing: data?.blockGetListing, loading };
};
