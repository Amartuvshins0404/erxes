import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { SCHEDULE_EXCEPTIONS_CURSOR_SESSION_KEY } from '../constants/scheduleCursorSessionKey';
import { ONE_FIT_SCHEDULE_EXCEPTIONS } from '../graphql/scheduleQueries';
import { ScheduleExceptionFilters } from '../types/schedule';

const SCHEDULE_EXCEPTIONS_PER_PAGE = 20;

export const useScheduleExceptions = (filters: ScheduleExceptionFilters) => {
  const { cursor } = useRecordTableCursor({
    sessionKey: SCHEDULE_EXCEPTIONS_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_SCHEDULE_EXCEPTIONS,
    {
      variables: {
        ...filters,
        cursor,
      },
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_SCHEDULE_EXCEPTIONS, {
    variables: { limit: 1 },
  });

  const {
    list: scheduleExceptions,
    totalCount,
    pageInfo,
  } = data?.oneFitScheduleExceptions || {};
  const overallTotalCount = overallData?.oneFitScheduleExceptions?.totalCount;

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
        limit: SCHEDULE_EXCEPTIONS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitScheduleExceptions: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitScheduleExceptions,
            prevResult: prev.oneFitScheduleExceptions,
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
    scheduleExceptions,
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
