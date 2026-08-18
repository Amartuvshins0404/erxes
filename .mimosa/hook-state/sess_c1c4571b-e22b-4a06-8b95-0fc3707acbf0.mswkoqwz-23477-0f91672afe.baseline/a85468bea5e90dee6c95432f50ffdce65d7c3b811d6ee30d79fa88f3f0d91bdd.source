import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { PROVIDERS_CURSOR_SESSION_KEY } from '../constants/providerCursorSessionKey';
import { ONE_FIT_PROVIDERS } from '../graphql/providerQueries';
import { ProviderFilters } from '../types/provider';

const PROVIDERS_PER_PAGE = 20;

export const useProviders = (filters?: ProviderFilters) => {
  const { cursor } = useRecordTableCursor({
    sessionKey: PROVIDERS_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_PROVIDERS,
    {
      variables: {
        ...filters,
        cursor,
      },
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_PROVIDERS, {
    variables: { limit: 1 },
  });

  const { list: providers, totalCount, pageInfo } = data?.oneFitProviders || {};
  const overallTotalCount = overallData?.oneFitProviders?.totalCount;

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
        limit: PROVIDERS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitProviders: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitProviders,
            prevResult: prev.oneFitProviders,
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
    providers,
    loading,
    error,
    totalCount,
    filteredTotalCount: totalCount,
    overallTotalCount,
    pageInfo,
    handleFetchMore,
    refetch: handleRefetch,
  };
};
