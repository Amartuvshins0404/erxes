import {
  EnumCursorDirection,
  ICursorListResponse,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import {
  GET_CV_MARKET_DETAIL,
  GET_CV_MARKETS,
} from '../graphql/cvMarketsQueries';
import { QueryHookOptions, useQuery } from '@apollo/client';
import { ICVMarket, ICVMarketDetail } from '../marketsTypes';
import { useEffect } from 'react';
import { marketsTotalCountAtom } from '../states/marketsTotalCountAtom';
import { useSetAtom } from 'jotai';
import { useFilters } from '~/hooks/useFilters';
import { MARKETS_FILTERS } from '../components/MarketsFilter';

export const useMarketDetail = ({ id }: { id: string }) => {
  const { data, loading, error } = useQuery<{ cvGetMarket: ICVMarketDetail }>(
    GET_CV_MARKET_DETAIL,
    {
      variables: { id },
    },
  );
  return {
    marketDetail: data?.cvGetMarket,
    loading,
    error,
  };
};

export const useMarkets = (
  options?: QueryHookOptions<ICursorListResponse<ICVMarket>>,
) => {
  const setMarketsTotalCount = useSetAtom(marketsTotalCountAtom);
  const { queries } = useFilters(MARKETS_FILTERS);

  const { data, loading, error, fetchMore } = useQuery<
    ICursorListResponse<ICVMarket>
  >(GET_CV_MARKETS, {
    variables: {
      ...options?.variables,
      filter: {
        ...queries,
        ...options?.variables?.filters,
      },
    },
  });
  const { list: markets, pageInfo, totalCount } = data?.cvGetMarkets || {};

  useEffect(() => {
    if (!totalCount) return;
    setMarketsTotalCount(totalCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount]);

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (!validateFetchMore({ direction, pageInfo })) {
      return;
    }

    fetchMore({
      variables: {
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: 30,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          cvGetMarkets: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.cvGetMarkets,
            prevResult: prev.cvGetMarkets,
          }),
        });
      },
    });
  };

  return {
    markets,
    pageInfo,
    totalCount,
    loading,
    error,
    handleFetchMore,
  };
};
