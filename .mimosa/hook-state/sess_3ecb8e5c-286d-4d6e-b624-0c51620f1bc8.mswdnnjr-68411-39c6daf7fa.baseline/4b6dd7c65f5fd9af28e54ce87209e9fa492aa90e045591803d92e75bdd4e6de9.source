import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  parseDateRangeFromString,
  useMultiQueryState,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { EVENTS } from '@/events/graphql/queries';
import {
  EVENTS_CURSOR_SESSION_KEY,
  EVENTS_PER_PAGE,
  EventPageTab,
} from '~/lib/constants';
import { IEventList } from '~/types/event';

export const useEventsVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, eventTab, status, startDate }] = useMultiQueryState<{
    searchValue: string;
    eventTab: EventPageTab;
    status: string;
    startDate: string;
  }>(['searchValue', 'eventTab', 'status', 'startDate']);

  const { cursor } = useRecordTableCursor({
    sessionKey: EVENTS_CURSOR_SESSION_KEY,
  });

  const range = parseDateRangeFromString(startDate);

  return {
    limit: EVENTS_PER_PAGE,
    cursor,
    searchValue: searchValue || undefined,
    tab: eventTab && eventTab !== 'draft' ? eventTab : undefined,
    status: status || (eventTab === 'draft' ? 'draft' : undefined),
    startDateFrom: range?.from,
    startDateTo: range?.to,
    ...(variables || {}),
  };
};

export const useEvents = (options?: QueryHookOptions) => {
  const variables = useEventsVariables(options?.variables);

  const { data, loading, error, fetchMore, refetch } = useQuery<{
    events: IEventList;
  }>(EVENTS, { ...options, variables });

  const { list: events, totalCount, pageInfo } = data?.events || {};

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
        ...variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: EVENTS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        const merged = mergeCursorData({
          direction,
          fetchMoreResult: fetchMoreResult.events,
          prevResult: prev.events,
        });

        return {
          ...prev,
          events: {
            ...fetchMoreResult.events,
            list: merged.list,
            pageInfo: merged.pageInfo,
          },
        };
      },
    });
  };

  return {
    events: events || [],
    totalCount: totalCount ?? 0,
    pageInfo,
    loading,
    error,
    refetch,
    handleFetchMore,
  };
};
