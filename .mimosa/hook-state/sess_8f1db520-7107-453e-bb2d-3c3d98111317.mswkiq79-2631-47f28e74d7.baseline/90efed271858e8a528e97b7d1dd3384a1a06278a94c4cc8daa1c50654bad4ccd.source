import { useQuery } from '@apollo/client';
import { GET_OFFERS, GET_OFFER } from '../graphql/offerQueries';
import { IOffer } from '@/offer/types/offerTypes';

export const useOffers = (unit?: string) => {
  const { data, loading, error, refetch } = useQuery<{
    blockGetOffers: IOffer[];
  }>(GET_OFFERS, {
    variables: { unit },
    skip: !unit,
  });

  return {
    offers: data?.blockGetOffers,
    loading,
    error,
    refetch,
  };
};

export const useOffer = (offerId?: string) => {
  const { data, loading, error } = useQuery<{
    blockGetOffer: IOffer;
  }>(GET_OFFER, {
    variables: { id: offerId },
    skip: !offerId,
  });

  return {
    offer: data?.blockGetOffer,
    loading,
    error,
  };
};
