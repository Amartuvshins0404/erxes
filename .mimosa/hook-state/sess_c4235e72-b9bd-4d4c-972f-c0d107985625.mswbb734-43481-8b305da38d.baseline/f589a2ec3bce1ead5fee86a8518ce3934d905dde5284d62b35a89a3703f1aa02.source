import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { PROMO_CODES_CURSOR_SESSION_KEY } from '../constants/promoCodeCursorSessionKey';
import { ONE_FIT_PROMO_CODES } from '../graphql/promoCodeQueries';
import { PromoCodeFilters } from '../types/promoCode';

const PROMO_CODES_PER_PAGE = 20;

export const usePromoCodes = (filters?: PromoCodeFilters) => {
  const { cursor } = useRecordTableCursor({
    sessionKey: PROMO_CODES_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_PROMO_CODES,
    {
      variables: {
        ...filters,
        cursor,
      },
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_PROMO_CODES, {
    variables: { limit: 1 },
  });

  const {
    list: promoCodes,
    totalCount,
    pageInfo,
  } = data?.oneFitPromoCodes || {};
  const overallTotalCount = overallData?.oneFitPromoCodes?.totalCount;

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (
      !validateFetchMore({
        direction,
        pageInfo,
      })
    ) {
      return;
    }

    fetchMore({
      variables: {
        ...filters,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: PROMO_CODES_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitPromoCodes: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitPromoCodes,
            prevResult: prev.oneFitPromoCodes,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
      cursor,
    });
  }, [refetch, filters, cursor]);

  return {
    promoCodes,
    loading,
    error,
    pageInfo,
    totalCount,
    filteredTotalCount: totalCount,
    overallTotalCount,
    handleFetchMore,
    refetch: handleRefetch,
  };
};
