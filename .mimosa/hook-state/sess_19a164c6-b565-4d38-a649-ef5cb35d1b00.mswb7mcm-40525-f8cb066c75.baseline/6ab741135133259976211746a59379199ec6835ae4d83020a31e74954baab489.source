import { useQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { ACTIVITY_TYPES_CURSOR_SESSION_KEY } from '../constants/activityTypeCursorSessionKey';
import { ONE_FIT_ACTIVITY_TYPES } from '../graphql/activityTypeQueries';
import { ActivityTypeFilters } from '../types/activityType';

const ACTIVITY_TYPES_PER_PAGE = 20;

export const useActivityTypes = (filters?: ActivityTypeFilters) => {
  const { cursor, setCursor } = useRecordTableCursor({
    sessionKey: ACTIVITY_TYPES_CURSOR_SESSION_KEY,
  });

  const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

  useEffect(() => {
    setCursor('');
  }, [filtersKey, setCursor]);

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_ACTIVITY_TYPES,
    {
      variables: {
        ...filters,
        cursor: cursor || undefined,
      },
      fetchPolicy: 'cache-and-network',
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_ACTIVITY_TYPES, {
    variables: { limit: 1 },
    fetchPolicy: 'cache-and-network',
  });

  const {
    list: activityTypes,
    totalCount,
    pageInfo,
  } = data?.oneFitActivityTypes || {};
  const overallTotalCount = overallData?.oneFitActivityTypes?.totalCount;

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
        limit: ACTIVITY_TYPES_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitActivityTypes: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitActivityTypes,
            prevResult: prev.oneFitActivityTypes,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
      cursor: cursor || undefined,
    });
  }, [refetch, filters, cursor]);

  return {
    activityTypes,
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
