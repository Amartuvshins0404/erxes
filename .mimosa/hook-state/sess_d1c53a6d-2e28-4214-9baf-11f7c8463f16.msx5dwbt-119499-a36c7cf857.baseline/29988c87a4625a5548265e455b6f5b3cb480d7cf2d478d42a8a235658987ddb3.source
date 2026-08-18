import { useMutation } from '@apollo/client';
import { UPDATE_LISTING } from '../graphql';

export const useUpdateListing = () => {
  const [updateListing, { loading, error }] = useMutation(UPDATE_LISTING, {
    refetchQueries: ['GetListings'],
  });

  return { updateListing, loading, error };
};
