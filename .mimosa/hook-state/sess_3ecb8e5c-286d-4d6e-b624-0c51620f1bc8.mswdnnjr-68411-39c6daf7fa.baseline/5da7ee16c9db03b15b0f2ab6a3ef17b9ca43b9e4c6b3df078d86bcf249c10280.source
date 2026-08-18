import { useMutation } from '@apollo/client';
import { CREATE_OFFER, UPDATE_OFFER } from '../graphql/offerMutations';
import { IOfferInput } from '../types/offerTypes';
import { GET_OFFERS } from '../graphql/offerQueries';
import { useQueryState } from 'erxes-ui';

export function useCreateOffer() {
  const [unitId] = useQueryState<string>('unitId');
  const [createOffer, { loading, error }] = useMutation(CREATE_OFFER, {
    refetchQueries: [{ query: GET_OFFERS, variables: { unit: unitId } }],
  });

  return {
    createOffer,
    loading,
    error,
  };
}

export function useUpdateOffer() {
  const [updateOffer, { loading, error }] = useMutation(UPDATE_OFFER, {
    refetchQueries: [{ query: GET_OFFERS }],
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
