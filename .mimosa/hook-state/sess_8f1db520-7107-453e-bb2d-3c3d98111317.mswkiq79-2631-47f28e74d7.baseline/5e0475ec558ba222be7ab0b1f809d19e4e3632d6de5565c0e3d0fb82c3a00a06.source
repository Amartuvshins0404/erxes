import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { SCHEDULE_TEMPLATES_CURSOR_SESSION_KEY } from '../constants/scheduleCursorSessionKey';
import { ONE_FIT_SCHEDULE_TEMPLATES } from '../graphql/scheduleQueries';
import { ScheduleTemplateFilters } from '../types/schedule';

const SCHEDULE_TEMPLATES_PER_PAGE = 20;

export const useSchedules = (filters?: ScheduleTemplateFilters) => {
  const { cursor } = useRecordTableCursor({
    sessionKey: SCHEDULE_TEMPLATES_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_SCHEDULE_TEMPLATES,
    {
      variables: {
        ...filters,
        cursor,
        limit: SCHEDULE_TEMPLATES_PER_PAGE,
      },
      errorPolicy: 'all',
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_SCHEDULE_TEMPLATES, {
    variables: { limit: 1 },
    errorPolicy: 'all',
  });

  const {
    list: scheduleTemplates,
    totalCount,
    pageInfo,
  } = data?.oneFitScheduleTemplates || {};
  const overallTotalCount = overallData?.oneFitScheduleTemplates?.totalCount;

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
        limit: SCHEDULE_TEMPLATES_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitScheduleTemplates: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitScheduleTemplates,
            prevResult: prev.oneFitScheduleTemplates,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
      cursor,
      limit: SCHEDULE_TEMPLATES_PER_PAGE,
    });
  }, [refetch, filters, cursor]);

  return {
    scheduleTemplates,
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
