import {
  Empty,
  FocusSheet,
  useQueryState,
  Badge,
  RecordTable,
  RecordTableInlineCell,
  EnumCursorDirection,
  mergeCursorData,
  Select,
} from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ColumnDef } from '@tanstack/table-core';
import { ONE_FIT_BOOKINGS } from '~/modules/booking/graphql/bookingQueries';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { useOneFitMode } from '~/modules/config/hooks/useOneFitMode';
import { OneFitCustomersInline } from '~/modules/onefitCustomer/components/OneFitCustomersInline';
import type { OneFitCustomer } from '~/modules/onefitCustomer/types/onefitCustomer';
import { format, parseISO } from 'date-fns';
import {
  AttendanceStatus,
  BookingStatus,
  OneFitBooking,
} from '~/modules/booking/types/booking';
import { IconAlertCircle, IconCloudExclamation } from '@tabler/icons-react';
import { FilterField } from '~/components/shared/FilterField';

const BOOKINGS_PER_PAGE = 100;

const SHEET_ATTENDANCE_FILTER_ALL = '__all__';

type AccountStatementSheetAttendanceFilter =
  | typeof SHEET_ATTENDANCE_FILTER_ALL
  | AttendanceStatus.NO_SHOW
  | AttendanceStatus.ATTENDED;

interface AccountStatementRow {
  year: number;
  month: number;
  providerId: string;
  provider?: {
    _id: string;
    businessName?: { en?: string; mn?: string };
  } | null;
  creditsEarnedCompleted: number;
  creditsEarnedNoShow: number;
  bookingCountCompleted: number;
  bookingCountNoShow: number;
  amountEarnedCompleted: number;
  amountEarnedNoShow: number;
}

function getStatusBadgeVariant(
  status: BookingStatus,
): 'success' | 'destructive' | 'info' | 'warning' | 'secondary' {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'success';
    case BookingStatus.CANCELLED:
      return 'destructive';
    case BookingStatus.COMPLETED:
      return 'info';
    case BookingStatus.NO_SHOW:
      return 'warning';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'Confirmed';
    case BookingStatus.CANCELLED:
      return 'Cancelled';
    case BookingStatus.COMPLETED:
      return 'Completed';
    case BookingStatus.NO_SHOW:
      return 'No Show';
    default:
      return status ?? '—';
  }
}

export const AccountStatementSheet = () => {
  const [open, setOpen] = useQueryState<string>('accountStatementId');
  const [attendanceFilter, setAttendanceFilter] =
    useState<AccountStatementSheetAttendanceFilter>(AttendanceStatus.ATTENDED);
  const { mode } = useOneFitMode();
  const isMasterMode = mode === 'master';

  const rowData = useMemo(() => {
    if (!open) return null;
    try {
      return JSON.parse(decodeURIComponent(open)) as AccountStatementRow;
    } catch {
      return null;
    }
  }, [open]);

  const { year, month, providerId } = rowData ?? {
    year: 0,
    month: 0,
    providerId: '',
  };

  useEffect(() => {
    setAttendanceFilter(AttendanceStatus.ATTENDED);
  }, [open, year, month, providerId]);

  const startDate = useMemo(() => {
    if (!year || !month) return undefined;
    return new Date(year, month - 1, 1);
  }, [year, month]);

  const endDate = useMemo(() => {
    if (!year || !month) return undefined;
    return new Date(year, month, 0, 23, 59, 59, 999);
  }, [year, month]);

  const baseVariables = useMemo(() => {
    const vars: {
      providerId?: string;
      startDate?: Date;
      endDate?: Date;
      limit: number;
      direction: 'forward';
      attendanceStatus?: AttendanceStatus;
    } = {
      providerId: providerId || undefined,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      limit: BOOKINGS_PER_PAGE,
      direction: 'forward' as const,
    };
    if (attendanceFilter === AttendanceStatus.NO_SHOW)
      vars.attendanceStatus = AttendanceStatus.NO_SHOW;
    if (attendanceFilter === AttendanceStatus.ATTENDED)
      vars.attendanceStatus = AttendanceStatus.ATTENDED;
    return vars;
  }, [providerId, startDate, endDate, attendanceFilter]);

  const { data, loading, fetchMore, error } = useQuery(ONE_FIT_BOOKINGS, {
    variables: {
      ...baseVariables,
      cursor: undefined,
    },
    skip: !open || !rowData || !providerId || !year || !month,
  });

  const { list: allBookingsRaw = [], pageInfo } = data?.oneFitBookings ?? {};
  const isFetchingAllPagesRef = useRef(false);
  const hasFetchedAllPagesRef = useRef(false);
  const [isLoadingAllBookings, setIsLoadingAllBookings] = useState(false);

  useEffect(() => {
    isFetchingAllPagesRef.current = false;
    hasFetchedAllPagesRef.current = false;
  }, [open, providerId, year, month, attendanceFilter]);

  useEffect(() => {
    if (!open || loading || !pageInfo?.hasNextPage || !pageInfo?.endCursor)
      return;
    if (isFetchingAllPagesRef.current || hasFetchedAllPagesRef.current) return;

    let cancelled = false;
    isFetchingAllPagesRef.current = true;
    setIsLoadingAllBookings(true);

    const fetchAllPages = async () => {
      let hasNextPage = !!pageInfo.hasNextPage;
      let nextCursor = pageInfo.endCursor;

      while (!cancelled && hasNextPage && nextCursor) {
        const result = await fetchMore({
          variables: {
            ...baseVariables,
            cursor: nextCursor,
            limit: BOOKINGS_PER_PAGE,
            direction: EnumCursorDirection.FORWARD,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            return {
              ...prev,
              oneFitBookings: mergeCursorData({
                direction: EnumCursorDirection.FORWARD,
                fetchMoreResult: fetchMoreResult.oneFitBookings,
                prevResult: prev.oneFitBookings,
              }),
            };
          },
        });

        const nextPageInfo = result?.data?.oneFitBookings?.pageInfo;
        hasNextPage = !!nextPageInfo?.hasNextPage;
        nextCursor = nextPageInfo?.endCursor;
      }

      if (!cancelled) {
        hasFetchedAllPagesRef.current = true;
      }
      isFetchingAllPagesRef.current = false;
      setIsLoadingAllBookings(false);
    };

    fetchAllPages().catch(() => {
      isFetchingAllPagesRef.current = false;
      setIsLoadingAllBookings(false);
    });

    return () => {
      cancelled = true;
      isFetchingAllPagesRef.current = false;
      setIsLoadingAllBookings(false);
    };
  }, [
    open,
    loading,
    pageInfo?.hasNextPage,
    pageInfo?.endCursor,
    fetchMore,
    baseVariables,
  ]);

  const showLoading = loading || isLoadingAllBookings;
  const bookings = allBookingsRaw;

  const totalCredits = useMemo(
    () =>
      bookings.reduce(
        (sum: number, b: OneFitBooking) => sum + (b.creditCost ?? 0),
        0,
      ),
    [bookings],
  );

  const totalPriceFromRows = useMemo(
    () =>
      bookings.reduce(
        (sum: number, b: OneFitBooking) => sum + (b.price ?? 0),
        0,
      ),
    [bookings],
  );

  const sheetSubtitle = useMemo(() => {
    if (!rowData) return '';
    if (attendanceFilter === SHEET_ATTENDANCE_FILTER_ALL)
      return `${bookings.length} booking${bookings.length === 1 ? '' : 's'}`;
    if (attendanceFilter === AttendanceStatus.NO_SHOW)
      return `${bookings.length} no-show booking${
        bookings.length === 1 ? '' : 's'
      }`;
    return `${bookings.length} attended booking${
      bookings.length === 1 ? '' : 's'
    }`;
  }, [rowData, attendanceFilter, bookings.length]);

  const providerName = rowData?.provider?.businessName
    ? getLocalizedString(rowData.provider.businessName, 'en')
    : providerId || '—';

  const title = rowData
    ? `Bookings - ${year}-${String(month).padStart(2, '0')} - ${providerName}`
    : 'Bookings';

  const columns: ColumnDef<OneFitBooking>[] = [
    {
      accessorKey: 'bookingId',
      header: 'BOOKING ID',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-xs font-mono">
          {(cell.getValue() as string) ?? '—'}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'user',
      header: 'USER',
      cell: ({ row: r }) => (
        <RecordTableInlineCell>
          <OneFitCustomersInline
            customers={
              r.original.user ? ([r.original.user] as OneFitCustomer[]) : []
            }
            placeholder="—"
          />
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'activityType',
      header: 'ACTIVITY',
      cell: ({ row: r }) => (
        <RecordTableInlineCell className="text-xs">
          {r.original.activityType
            ? getLocalizedString(r.original.activityType.name, 'en')
            : '—'}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'bookingDate',
      header: 'DATE',
      cell: ({ cell }) => {
        const v = cell.getValue() as string | undefined;
        if (!v) return <RecordTableInlineCell>—</RecordTableInlineCell>;
        const d = typeof v === 'string' ? parseISO(v) : new Date(v);
        return (
          <RecordTableInlineCell className="text-xs">
            {format(d, 'yyyy-MM-dd')}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ cell }) => (
        <RecordTableInlineCell>
          <Badge
            variant={getStatusBadgeVariant(cell.getValue() as BookingStatus)}
          >
            {getStatusLabel(cell.getValue() as BookingStatus)}
          </Badge>
        </RecordTableInlineCell>
      ),
    },
    ...(isMasterMode
      ? [
          {
            accessorKey: 'creditCost',
            header: 'CREDITS',
            cell: ({ cell }: { cell: any }) => (
              <RecordTableInlineCell className="text-xs">
                {(cell.getValue() as number)?.toFixed(2) ?? '—'}
              </RecordTableInlineCell>
            ),
          },
        ]
      : []),
    {
      accessorKey: 'price',
      header: 'AMOUNT',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-xs">
          {(cell.getValue() as number) != null
            ? (cell.getValue() as number).toFixed(2)
            : '—'}
        </RecordTableInlineCell>
      ),
    },
  ];

  return (
    <FocusSheet open={!!open} onOpenChange={() => setOpen(null)}>
      <FocusSheet.View
        loading={showLoading}
        error={!!error || !rowData}
        notFound={!rowData}
        notFoundState={<AccountStatementEmptyState />}
        errorState={<AccountStatementErrorState />}
      >
        <FocusSheet.Header title={title} />
        <FocusSheet.Content>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-wrap items-end gap-4 mb-4 flex-shrink-0">
                <FilterField label="Attendance">
                  <Select
                    value={attendanceFilter}
                    onValueChange={(value) =>
                      setAttendanceFilter(
                        value as AccountStatementSheetAttendanceFilter,
                      )
                    }
                  >
                    <Select.Trigger className="min-w-[200px]">
                      <Select.Value placeholder="Attendance" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value={AttendanceStatus.ATTENDED}>
                        Attended
                      </Select.Item>
                      <Select.Item value={AttendanceStatus.NO_SHOW}>
                        No show
                      </Select.Item>
                      <Select.Item value={SHEET_ATTENDANCE_FILTER_ALL}>
                        All
                      </Select.Item>
                    </Select.Content>
                  </Select>
                </FilterField>
              </div>

              {sheetSubtitle ? (
                <div className="text-sm text-muted-foreground mb-4 flex-shrink-0">
                  {sheetSubtitle}
                </div>
              ) : null}

              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="rounded-md border">
                    <RecordTable.Provider
                      columns={columns}
                      data={bookings}
                      className="m-0"
                    >
                      <RecordTable>
                        <RecordTable.Header />
                        <RecordTable.Body>
                          {showLoading && <RecordTable.RowSkeleton rows={10} />}
                          {!showLoading && <RecordTable.RowList />}
                        </RecordTable.Body>
                      </RecordTable>
                    </RecordTable.Provider>
                  </div>

                  {!showLoading && bookings.length > 0 && (
                    <div className="border-t bg-muted/30 px-4 py-2 text-sm font-medium space-y-1 mt-2 flex-shrink-0">
                      {isMasterMode && (
                        <div>Total credits: {totalCredits.toFixed(2)}</div>
                      )}
                      <div>Total amount: {totalPriceFromRows.toFixed(2)}</div>
                    </div>
                  )}

                  {!showLoading && bookings.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4">
                      No bookings match the selected attendance filter for this
                      period.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FocusSheet.Content>
      </FocusSheet.View>
    </FocusSheet>
  );
};

const AccountStatementEmptyState = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconCloudExclamation />
          </Empty.Media>
          <Empty.Title>Account statement not found</Empty.Title>
          <Empty.Description>
            There seems to be no account statement with this ID.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    </div>
  );
};

const AccountStatementErrorState = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconAlertCircle />
          </Empty.Media>
          <Empty.Title>Error</Empty.Title>
          <Empty.Description>
            Failed to load account statement details.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    </div>
  );
};
