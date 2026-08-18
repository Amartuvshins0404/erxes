import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  BLOCK_ADMIN_UPDATE_LISTING_STATUS,
  GET_ADMIN_LISTINGS,
} from '../graphql';

interface ListingStatusInput {
  status?: string;
  isFeatured?: boolean;
}

export const useAdminUpdateListing = () => {
  const [mutate, { loading }] = useMutation(BLOCK_ADMIN_UPDATE_LISTING_STATUS, {
    refetchQueries: [{ query: GET_ADMIN_LISTINGS }],
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Listing updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateListing = (_id: string, input: ListingStatusInput) => {
    return mutate({ variables: { _id, input } });
  };

  return { updateListing, loading };
};
