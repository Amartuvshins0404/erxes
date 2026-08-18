import { useMutation } from '@apollo/client';
import { DELETE_CV_MARKET } from '../graphql/cvMarketsMutation';

export const useMarketsRemove = () => {
  const [removeMarket, { loading }] = useMutation(DELETE_CV_MARKET, {
    refetchQueries: ['GetCVMarkets'],
  });

  return { removeMarket, loading };
};

