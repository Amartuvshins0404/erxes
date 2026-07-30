import { useMutation } from '@apollo/client';
import { CREATE_OFFER, UPDATE_OFFER } from '../graphql/offerMutations';
import { IOfferInput } from '../types/offerTypes';

export function useCreateOffer() {
  const [createOffer, { loading, error }] = useMutation(CREATE_OFFER, {
    refetchQueries: ['BlockGetOffersList'],
  });

  return {
    createOffer,
    loading,
    error,
  };
}

export function useUpdateOffer() {
  const [updateOffer, { loading, error }] = useMutation(UPDATE_OFFER, {
    refetchQueries: ['BlockGetOffersList'],
  });

  const handleUpdate = async (id: string, input: IOfferInput) => {
    const { data } = await updateOffer({
      variables: { id, input },
    });
    return data?.blockUpdateOffer;
  };

  return {
    updateOffer: handleUpdate,
    loading,
    error,
  };
}
