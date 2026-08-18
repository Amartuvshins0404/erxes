import { useMutation } from '@apollo/client';
import { CREATE_CV_MARKET } from '../graphql/cvMarketsMutation';
import { GET_CV_MARKETS } from '../graphql/cvMarketsQueries';

export const useMarketsCreate = () => {
  const [createMarket, { loading }] = useMutation(CREATE_CV_MARKET, {
    refetchQueries: [GET_CV_MARKETS],
  });

  return { createMarket, loading };
};
