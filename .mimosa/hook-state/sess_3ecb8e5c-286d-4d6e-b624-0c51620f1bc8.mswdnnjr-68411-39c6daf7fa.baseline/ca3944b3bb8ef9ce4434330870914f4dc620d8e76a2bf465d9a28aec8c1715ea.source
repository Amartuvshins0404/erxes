import { useMutation } from '@apollo/client';
import { REMOVE_LISTING } from '../graphql';

export const useRemoveListing = () => {
  const [removeListing, { loading, error }] = useMutation(REMOVE_LISTING, {
    refetchQueries: ['GetListings'],
  });

  return { removeListing, loading, error };
};
