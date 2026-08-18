import { useQuery } from '@apollo/client';
import { GET_OFFERS_LIST } from '../graphql/offerQueries';
import { IOffer } from '../types/offerTypes';

interface ICustomerOffersResponse {
  blockGetOffersList: {
    list: IOffer[];
    totalCount: number;
  };
}

const CUSTOMER_OFFERS_LIMIT = 20;

export const useCustomerOffers = (customerId?: string) => {
  const { data, loading, refetch } = useQuery<ICustomerOffersResponse>(
    GET_OFFERS_LIST,
    {
      variables: {
        filter: { customerId },
        limit: CUSTOMER_OFFERS_LIMIT,
        cursor: '',
        direction: 'forward',
      },
      skip: !customerId,
      fetchPolicy: 'cache-and-network',
    },
  );

  return {
    offers: data?.blockGetOffersList?.list || [],
    loading,
    refetch,
  };
};
