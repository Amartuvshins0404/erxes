import { NetworkStatus, useQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { EnumCursorDirection, mergeCursorData } from 'erxes-ui';
import { ONE_FIT_CREDIT_CONSUMPTION_BOOKINGS } from '../graphql/bookingQueries';

/** Larger pages = fewer round-trips when loading the full list. */
const PAGE_SIZE = 100;

/** Group by user, newest reservation first (matches spreadsheet-style export). */
const defaultOrderBy = { userId: 'asc' as const, bookingDate: 'desc' as const };

export function useCreditConsumptionBookings(args: {
  startDate: string;
  endDate: string;
  companyId: string;
  planId: string;
  enabled: boolean;
}) {
  const { startDate, endDate, companyId, planId, enabled } = args;
  const fetchInFlight = useRef(false);

  const baseVariables = useMemo(
    () => ({
      startDate,
      endDate,
      companyId: companyId || undefined,
      planId: planId || undefined,
      orderBy: defaultOrderBy,
    }),
    [startDate, endDate, companyId, planId],
  );

  const { data, error, fetchMore, refetch, networkStatus } = useQuery(
    ONE_FIT_CREDIT_CONSUMPTION_BOOKINGS,
    {
      variables: {
        ...baseVariables,
        limit: PAGE_SIZE,
      },
      skip: !enabled || !startDate || !endDate,
      notifyOnNetworkStatusChange: true,
    },
  );

  const {
    list: bookings,
    totalCount,
    pageInfo,
  } = data?.oneFitCreditConsumptionBookings || {};

  const hasNextPage = Boolean(pageInfo?.hasNextPage);
  const isInitialLoading = networkStatus === NetworkStatus.loading;
  const isFetchMore = networkStatus === NetworkStatus.fetchMore;
  const allBookingsLoaded =
    !hasNextPage && Boolean(data?.oneFitCreditConsumptionBookings);
  const loadingAll =
    (isInitialLoading && !data) || (hasNextPage && isFetchMore);

  /** Chain fetchMore until the full list is in the cache (no next page). */
  useEffect(() => {
    if (!enabled || !startDate || !endDate) return;
    if (isInitialLoading && !data) return;
    const o = data?.oneFitCreditConsumptionBookings;
    if (!o?.pageInfo?.hasNextPage) return;
    if (isFetchMore) return;
    if (fetchInFlight.current) return;

    fetchInFlight.current = true;
    void fetchMore({
      variables: {
        ...baseVariables,
        cursor: o.pageInfo.endCursor,
        limit: PAGE_SIZE,
        direction: EnumCursorDirection.FORWARD,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          oneFitCreditConsumptionBookings: mergeCursorData({
            direction: EnumCursorDirection.FORWARD,
            fetchMoreResult: fetchMoreResult.oneFitCreditConsumptionBookings,
            prevResult: prev.oneFitCreditConsumptionBookings,
          }),
        };
      },
    }).finally(() => {
      fetchInFlight.current = false;
    });
  }, [
    enabled,
    startDate,
    endDate,
    data,
    isInitialLoading,
    isFetchMore,
    fetchMore,
    baseVariables,
  ]);

  const handleRefetch = useCallback(() => {
    fetchInFlight.current = false;
    return refetch({
      ...baseVariables,
      limit: PAGE_SIZE,
    });
  }, [refetch, baseVariables]);

  /**
   * No further manual pages — list is auto-loaded. Kept for RecordTable API (no-ops in practice).
   */
  const handleFetchMore = useCallback(() => {
    /* reserved */
  }, []);

  return {
    bookings: bookings || [],
    loading: isInitialLoading,
    /** True for initial load or while a follow-up page is in flight. */
    loadingAll,
    allBookingsLoaded: enabled && allBookingsLoaded,
    error,
    totalCount,
    pageInfo: {
      ...pageInfo,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    handleFetchMore,
    refetch: handleRefetch,
  };
}
