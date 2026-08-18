import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import {
  ONE_FIT_PROVIDER_REVIEWS,
  ONE_FIT_PROVIDER_REVIEW_SUMMARY,
} from '~/modules/provider/graphql/providerReviewQueries';
import { OneFitProviderReviewListResponse } from '~/modules/provider/types/provider';

const REVIEWS_PER_PAGE = 15;

export function useProviderReviews(providerId: string | undefined) {
  const { cursor } = useRecordTableCursor({
    sessionKey: `onefit-provider-reviews-${providerId || 'none'}`,
  });

  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(ONE_FIT_PROVIDER_REVIEW_SUMMARY, {
    variables: { providerId: providerId || '' },
    skip: !providerId,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery<{
    oneFitProviderReviews: OneFitProviderReviewListResponse;
  }>(ONE_FIT_PROVIDER_REVIEWS, {
    variables: {
      providerId: providerId || '',
      cursor,
      limit: REVIEWS_PER_PAGE,
    },
    skip: !providerId,
  });

  const reviewsResult = data?.oneFitProviderReviews;
  const { list: reviews, totalCount, pageInfo } = reviewsResult || {};

  const handleFetchMore = useCallback(() => {
    if (
      !validateFetchMore({
        direction: EnumCursorDirection.FORWARD,
        pageInfo,
      })
    ) {
      return;
    }

    fetchMore({
      variables: {
        providerId,
        cursor: pageInfo?.endCursor,
        limit: REVIEWS_PER_PAGE,
        direction: EnumCursorDirection.FORWARD,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitProviderReviews: mergeCursorData({
            direction: EnumCursorDirection.FORWARD,
            fetchMoreResult: fetchMoreResult.oneFitProviderReviews,
            prevResult: prev.oneFitProviderReviews,
          }),
        });
      },
    });
  }, [fetchMore, pageInfo, providerId]);

  const handleRefetch = useCallback(() => {
    return refetch({
      providerId,
      cursor,
      limit: REVIEWS_PER_PAGE,
    });
  }, [refetch, providerId, cursor]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      handleRefetch(),
      providerId ? refetchSummary({ providerId }) : Promise.resolve(undefined),
    ]);
  }, [handleRefetch, providerId, refetchSummary]);

  return {
    summary: summaryData?.oneFitProviderReviewSummary,
    reviews,
    totalCount,
    pageInfo,
    loading: loading || summaryLoading,
    error,
    handleFetchMore,
    refetch: handleRefetch,
    refetchAll,
  };
}
