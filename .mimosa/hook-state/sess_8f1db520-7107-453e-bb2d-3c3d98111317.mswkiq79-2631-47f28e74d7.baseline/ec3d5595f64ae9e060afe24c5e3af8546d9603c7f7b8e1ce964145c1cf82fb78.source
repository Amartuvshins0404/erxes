import { useMutation } from '@apollo/client';
import { UPDATE_CV_MARKET } from '../graphql/cvMarketsMutation';
import { GET_CV_MARKET_DETAIL } from '../graphql/cvMarketsQueries';
import { toast } from 'erxes-ui';

export const useMarketsUpdate = ({ id }: { id: string }) => {
  const [updateMarket, { loading }] = useMutation(UPDATE_CV_MARKET, {
    refetchQueries: [
      'GetCVMarkets',
      { query: GET_CV_MARKET_DETAIL, variables: { id } },
    ],
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Market updated successfully',
        variant: 'success',
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

  return { updateMarket, loading };
};

