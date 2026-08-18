import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { BANNERS_CURSOR_SESSION_KEY } from '../constants/bannerCursorSessionKey';
import { ONE_FIT_BANNERS } from '../graphql/bannerQueries';
import { BannerFilters } from '../types/banner';

const BANNERS_PER_PAGE = 20;

export const useBanners = (filters?: BannerFilters) => {
  const { cursor } = useRecordTableCursor({
    sessionKey: BANNERS_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_BANNERS,
    {
      variables: {
        ...filters,
        cursor,
      },
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_BANNERS, {
    variables: { limit: 1 },
  });

  const { list: banners, totalCount, pageInfo } = data?.oneFitBanners || {};
  const overallTotalCount = overallData?.oneFitBanners?.totalCount;

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
        limit: BANNERS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitBanners: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitBanners,
            prevResult: prev.oneFitBanners,
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
    banners,
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
