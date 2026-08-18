import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Tooltip,
} from 'erxes-ui';
import {
  IconBan,
  IconReceiptRefund,
  IconUserCheck,
  IconCheck,
} from '@tabler/icons-react';
import { useBookings } from '../hooks/useBookings';
import {
  BookingFilters,
  BookingStatus,
  AttendanceStatus,
  type OneFitBooking,
} from '../types/booking';
import { BOOKINGS_CURSOR_SESSION_KEY } from '../constants/bookingCursorSessionKey';
import { CancelBookingDialog } from './CancelBookingDialog';
import { MarkAttendanceDialog } from './MarkAttendanceDialog';
import { useMemo, useState } from 'react';
import { OneFitCustomersInline } from '~/modules/onefitCustomer/components/OneFitCustomersInline';
import {
  ActivityLanguage,
  getLocalizedString,
} from '~/modules/activity-type/utils/localization';
import { OneFitCustomer } from '@/credit/types/credit';
import { useOneFitMode } from '~/modules/config/hooks/useOneFitMode';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface BookingsListProps {
  filters?: BookingFilters;
  preferredLanguage?: ActivityLanguage;
  excludeCancelled?: boolean;
  sessionKey?: string;
  /** Customer detail: hide user columns, credit summary bar, Credit Cost column after activity */
  customerDetailView?: boolean;
  creditSummary?: {
    totalCreditsUsed?: number | null;
    currentCreditBalance?: number | null;
  };
}

const getStatusBadgeVariant = (status: BookingStatus) => {
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
};

const getStatusLabel = (
  status: BookingStatus,
  language: ActivityLanguage,
): string => {
  const labels: Record<ActivityLanguage, Record<BookingStatus, string>> = {
    en: {
      [BookingStatus.CONFIRMED]: 'Confirmed',
      [BookingStatus.CANCELLED]: 'Cancelled',
      [BookingStatus.COMPLETED]: 'Completed',
      [BookingStatus.NO_SHOW]: 'No show',
    },
    mn: {
      [BookingStatus.CONFIRMED]: 'Баталгаажсан',
      [BookingStatus.CANCELLED]: 'Цуцлагдсан',
      [BookingStatus.COMPLETED]: 'Дууссан',
      [BookingStatus.NO_SHOW]: 'Ирээгүй',
    },
  };

  return labels[language]?.[status] ?? status;
};

const getAttendanceBadgeVariant = (status: AttendanceStatus) => {
  switch (status) {
    case AttendanceStatus.ATTENDED:
      return 'success';
    case AttendanceStatus.NO_SHOW:
      return 'warning';
    case AttendanceStatus.PENDING:
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getAttendanceLabel = (
  status: AttendanceStatus,
  language: ActivityLanguage,
): string => {
  const labels: Record<ActivityLanguage, Record<AttendanceStatus, string>> = {
    en: {
      [AttendanceStatus.PENDING]: 'Pending',
      [AttendanceStatus.ATTENDED]: 'Attended',
      [AttendanceStatus.NO_SHOW]: 'No show',
    },
    mn: {
      [AttendanceStatus.PENDING]: 'Хүлээгдэж буй',
      [AttendanceStatus.ATTENDED]: 'Ирсэн',
      [AttendanceStatus.NO_SHOW]: 'Ирээгүй',
    },
  };

  return labels[language]?.[status] ?? status;
};

const getDisplayName = (user: OneFitCustomer | undefined): string => {
  if (!user) return '-';
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.primaryEmail ||
    user.primaryPhone ||
    'Unnamed user'
  );
};

export const BookingsList = ({
  filters,
  preferredLanguage = 'en',
  excludeCancelled = false,
  sessionKey,
  customerDetailView = false,
  creditSummary,
}: BookingsListProps) => {
  const {
    bookings,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useBookings(filters, {
    sessionKey,
  });
  const [selectedBooking, setSelectedBooking] = useState<OneFitBooking | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const { isSlaveMode } = useOneFitMode();

  const { hasPreviousPage, hasNextPage } = pageInfo || {};
  const visibleBookings = excludeCancelled
    ? (bookings || []).filter(
        (booking: OneFitBooking) => booking.status !== BookingStatus.CANCELLED,
      )
    : bookings || [];

  const creditsOnThisPage = useMemo(
    () =>
      visibleBookings.reduce(
        (sum: number, b: OneFitBooking) => sum + (Number(b.creditCost) || 0),
        0,
      ),
    [visibleBookings],
  );

  const creditCostColumn: ColumnDef<any> = {
    accessorKey: 'creditCost',
    id: 'creditCost',
    header: 'Credit Cost',
    cell: ({ row }: { row: { original: OneFitBooking } }) => {
      const value = row.original.creditCost;
      const display =
        value === null || value === undefined ? '—' : Number(value);
      return (
        <RecordTableInlineCell className="text-xs font-medium tabular-nums text-foreground">
          {display}
        </RecordTableInlineCell>
      );
    },
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'bookingId',
      header: 'Booking ID',
      cell: ({ row }: { row: { original: any } }) => {
        const booking = row.original;
        return (
          <RecordTableInlineCell className="text-xs font-medium font-mono">
            {booking.bookingId ?? '-'}
          </RecordTableInlineCell>
        );
      },
    },
    ...(customerDetailView
      ? []
      : [
          {
            accessorKey: 'user',
            header: 'User',
            cell: ({ row }: { row: { original: any } }) => {
              const booking = row.original;
              const user: OneFitCustomer | undefined = booking.user;
              if (!user) {
                return (
                  <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
                    -
                  </RecordTableInlineCell>
                );
              }
              return (
                <RecordTableInlineCell>
                  <OneFitCustomersInline
                    customers={[user]}
                    placeholder="Unnamed user"
                  />
                </RecordTableInlineCell>
              );
            },
          } as ColumnDef<any>,
          {
            accessorKey: 'user',
            id: 'name',
            header: 'Name',
            cell: ({ row }: { row: { original: any } }) => {
              const booking = row.original;
              const name = getDisplayName(booking.user);
              return (
                <RecordTableInlineCell
                  className="text-xs font-medium truncate"
                  title={name}
                >
                  {name}
                </RecordTableInlineCell>
              );
            },
          } as ColumnDef<any>,
        ]),
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ row }: { row: { original: any } }) => {
        const booking = row.original;
        const provider = booking.provider;
        const providerName = provider?.businessName
          ? getLocalizedString(provider.businessName, preferredLanguage)
          : '-';
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {providerName}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'activityType',
      header: 'Activity Type',
      cell: ({ row }) => {
        const booking = row.original;
        const activityType = booking.activityType;
        const name = activityType?.name
          ? getLocalizedString(activityType.name, preferredLanguage)
          : '-';
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {name}
          </RecordTableInlineCell>
        );
      },
    },
    ...(customerDetailView ? [creditCostColumn] : []),
    {
      accessorKey: 'bookingDate',
      header: 'Date & Time',
      cell: ({ row }) => {
        const booking = row.original;
        const dateTime = `${booking.bookingDate} ${booking.startTime} - ${booking.endTime}`;
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            <RelativeDateDisplay value={booking.bookingDate} asChild>
              <div className="flex flex-col">
                <RelativeDateDisplay.Value value={booking.bookingDate} />
                <span className="text-muted-foreground text-xs">
                  {booking.startTime} - {booking.endTime}
                </span>
              </div>
            </RelativeDateDisplay>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created Date',
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            <RelativeDateDisplay value={booking.createdAt} asChild>
              <RelativeDateDisplay.Value value={booking.createdAt} />
            </RelativeDateDisplay>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => {
        const status = cell.getValue() as BookingStatus;
        const label = getStatusLabel(status, preferredLanguage);
        return (
          <RecordTableInlineCell>
            <Badge
              variant={getStatusBadgeVariant(status)}
              className="capitalize"
            >
              {label}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'attendanceStatus',
      header: 'Attendance',
      cell: ({ cell }) => {
        const status = cell.getValue() as AttendanceStatus;
        const label = getAttendanceLabel(status, preferredLanguage);
        return (
          <RecordTableInlineCell>
            <Badge
              variant={getAttendanceBadgeVariant(status)}
              className="capitalize"
            >
              {label}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    ...(!customerDetailView ? [creditCostColumn] : []),
    ...(!isSlaveMode
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: any } }) => {
              const booking = row.original;
              const isCancelled = booking.status === BookingStatus.CANCELLED;
              const isCompleted = booking.status === BookingStatus.COMPLETED;
              const isNoShow =
                booking.status === BookingStatus.NO_SHOW ||
                booking.attendanceStatus === AttendanceStatus.NO_SHOW;
              const isNoShowActive =
                booking.status === BookingStatus.NO_SHOW ||
                (booking.status === BookingStatus.CONFIRMED &&
                  booking.attendanceStatus === AttendanceStatus.NO_SHOW);
              const canMarkAttendance =
                !isCancelled &&
                !isCompleted &&
                (booking.status === BookingStatus.CONFIRMED ||
                  booking.status === BookingStatus.NO_SHOW);

              return (
                <RecordTableInlineCell>
                  <div className="flex items-center gap-1">
                    {!isCancelled && !isCompleted && (
                      <Tooltip>
                        <Tooltip.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setCancelDialogOpen(true);
                            }}
                          >
                            {isNoShow ? (
                              <IconReceiptRefund className="h-4 w-4" />
                            ) : (
                              <IconBan className="h-4 w-4" />
                            )}
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          {isNoShow ? 'Cancel & refund' : 'Cancel'}
                        </Tooltip.Content>
                      </Tooltip>
                    )}
                    {canMarkAttendance && (
                      <Tooltip>
                        <Tooltip.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setAttendanceDialogOpen(true);
                            }}
                          >
                            {isNoShowActive ? (
                              <IconCheck className="h-4 w-4" />
                            ) : (
                              <IconUserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          {isNoShowActive ? 'Mark attended' : 'Mark attendance'}
                        </Tooltip.Content>
                      </Tooltip>
                    )}
                  </div>
                </RecordTableInlineCell>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <>
      {customerDetailView ? (
        <div className="mx-3 mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Total credits used (account):{' '}
            <span className="font-medium tabular-nums text-foreground">
              {creditSummary?.totalCreditsUsed ?? '—'}
            </span>
          </span>
          <span className="text-muted-foreground">
            Current balance:{' '}
            <span className="font-medium tabular-nums text-foreground">
              {creditSummary?.currentCreditBalance ?? '—'}
            </span>
          </span>
          <span className="text-muted-foreground">
            Credits on this page:{' '}
            <span className="font-medium tabular-nums text-foreground">
              {creditsOnThisPage}
            </span>
          </span>
        </div>
      ) : null}
      <ListTotalsLabel
        filteredTotalCount={filteredTotalCount}
        overallTotalCount={overallTotalCount}
        loading={loading}
      />
      <RecordTable.Provider
        columns={columns}
        data={visibleBookings}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={visibleBookings.length}
          sessionKey={sessionKey || BOOKINGS_CURSOR_SESSION_KEY}
        >
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              <RecordTable.CursorBackwardSkeleton
                handleFetchMore={handleFetchMore}
              />
              {loading && <RecordTable.RowSkeleton rows={40} />}
              <RecordTable.RowList />
              <RecordTable.CursorForwardSkeleton
                handleFetchMore={handleFetchMore}
              />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.CursorProvider>
      </RecordTable.Provider>

      {selectedBooking && (
        <>
          <CancelBookingDialog
            bookingId={selectedBooking._id}
            isNoShowBooking={
              selectedBooking.status === BookingStatus.NO_SHOW ||
              selectedBooking.attendanceStatus === AttendanceStatus.NO_SHOW
            }
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onClose={() => {
              setCancelDialogOpen(false);
              setSelectedBooking(null);
            }}
          />
          <MarkAttendanceDialog
            bookingId={selectedBooking._id}
            noShowOverride={
              selectedBooking.status === BookingStatus.NO_SHOW ||
              selectedBooking.attendanceStatus === AttendanceStatus.NO_SHOW
            }
            open={attendanceDialogOpen}
            onOpenChange={setAttendanceDialogOpen}
            onClose={() => {
              setAttendanceDialogOpen(false);
              setSelectedBooking(null);
            }}
          />
        </>
      )}
    </>
  );
};
