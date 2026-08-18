import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { ColumnDef } from '@tanstack/table-core';
import { IconDownload } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Input,
  Label,
  RecordTable,
  RecordTableInlineCell,
  Select,
  Switch,
} from 'erxes-ui';
import { ONE_FIT_CREDIT_CONSUMPTION } from '~/modules/booking/graphql/bookingQueries';
import {
  BookingStatus,
  CreditConsumptionRow,
  type OneFitBooking,
} from '~/modules/booking/types/booking';
import { FilterField } from '~/components/shared/FilterField';
import { SelectCompany } from '~/modules/credit/components/SelectCompany';
import { ONE_FIT_ACTIVE_MEMBERSHIP_PLANS } from '~/modules/membership/graphql/membershipPlanQueries';
import {
  getLocalizedString,
  type ActivityLanguage,
} from '~/modules/activity-type/utils/localization';
import { useCreditConsumptionBookings } from '../hooks/useCreditConsumptionBookings';
import { CREDIT_CONSUMPTION_BOOKINGS_CURSOR_SESSION_KEY } from '../constants/bookingCursorSessionKey';

const detailLang: ActivityLanguage = 'en';

function escapeCsvValue(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function startOfMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function endOfMonth(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** One row per reservation; user columns repeat only on first line of each user (spreadsheet style). */
type AugmentedCreditBooking = OneFitBooking & {
  _isFirstInUserGroup: boolean;
};

function formatCustomerSex(sex: number | null | undefined): string {
  if (sex == null) return '—';
  if (sex === 1) return 'Male';
  if (sex === 2) return 'Female';
  return '—';
}

function formatBirthDateYmd(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

function formatReservationDateTime(
  createdAt: string | undefined,
  bookingDate: string,
): string {
  const raw = createdAt || bookingDate;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day} ${h}:${min}`;
}

function formatYmd(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

function getStatusBadgeVariant(status: BookingStatus) {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'success' as const;
    case BookingStatus.CANCELLED:
      return 'destructive' as const;
    case BookingStatus.COMPLETED:
      return 'info' as const;
    case BookingStatus.NO_SHOW:
      return 'warning' as const;
    default:
      return 'secondary' as const;
  }
}

function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    [BookingStatus.CONFIRMED]: 'Confirmed',
    [BookingStatus.CANCELLED]: 'Cancelled',
    [BookingStatus.COMPLETED]: 'Completed',
    [BookingStatus.NO_SHOW]: 'No show',
  };
  return labels[status] ?? status;
}

function getBookingUserDisplayName(user: OneFitBooking['user'] | undefined) {
  if (!user) return '—';
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.primaryEmail ||
    user.primaryPhone ||
    '—'
  );
}

function bookingUserKey(b: OneFitBooking) {
  return String(b.userId ?? b.user?._id ?? '');
}

/** Matches the "individual reservations" table row content (incl. blank user cells per spreadsheet rules). */
function individualReservationToCsvRow(row: AugmentedCreditBooking) {
  const u = row.user;
  const first = row._isFirstInUserGroup;
  const name = first ? getBookingUserDisplayName(u) : '';
  const phone = first ? (u?.primaryPhone ?? '—') : '';
  const gender = first ? formatCustomerSex(u?.sex ?? undefined) : '';
  const birth = first ? formatBirthDateYmd(u?.birthDate) : '';
  const bookedAt = formatReservationDateTime(row.createdAt, row.bookingDate);
  const partner = row.provider?.businessName
    ? getLocalizedString(row.provider.businessName, detailLang)
    : '—';
  const classLabel = row.activityType?.name
    ? getLocalizedString(row.activityType.name, detailLang)
    : '—';
  const p = row.price;
  const priceStr =
    p == null || Number.isNaN(Number(p))
      ? '—'
      : Math.round(Number(p)).toLocaleString();
  const id = u?.oneFitMembershipPlanId;
  const plan = id && String(id).trim() ? String(id) : '—';
  const start = formatYmd(row.bookingDate);
  const end = formatYmd(row.bookingDate);
  const credits =
    row.creditCost == null || row.creditCost === undefined
      ? '—'
      : Number(row.creditCost).toFixed(2);
  const status = getStatusLabel(row.status);
  return [
    name,
    phone,
    gender,
    birth,
    bookedAt,
    partner,
    classLabel,
    priceStr,
    plan,
    start,
    end,
    credits,
    status,
  ];
}

export function CreditConsumptionReport() {
  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(startOfMonth(now));
  const [endDate, setEndDate] = useState(endOfMonth(now));
  const [companyId, setCompanyId] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [showIndividualBookings, setShowIndividualBookings] = useState(false);
  const { data: plansData } = useQuery(ONE_FIT_ACTIVE_MEMBERSHIP_PLANS);
  const activeMembershipPlans = plansData?.oneFitActiveMembershipPlans ?? [];

  const { data, loading: loadingAggregate } = useQuery(
    ONE_FIT_CREDIT_CONSUMPTION,
    {
      variables: {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        companyId: companyId || undefined,
        planId: planId || undefined,
      },
      skip: !startDate || !endDate,
    },
  );

  const {
    bookings,
    loading: loadingBookings,
    loadingAll: loadingAllBookings,
    allBookingsLoaded: allDetailBookingsLoaded,
    pageInfo,
    handleFetchMore,
  } = useCreditConsumptionBookings({
    startDate,
    endDate,
    companyId,
    planId,
    enabled: showIndividualBookings,
  });

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const detailDisplayRows: AugmentedCreditBooking[] = useMemo(() => {
    if (!showIndividualBookings) return [];
    const sorted = [...bookings].sort((a, b) => {
      const ka = bookingUserKey(a);
      const kb = bookingUserKey(b);
      if (ka !== kb) return ka.localeCompare(kb);
      const at = new Date(a.createdAt || a.bookingDate).getTime();
      const bt = new Date(b.createdAt || b.bookingDate).getTime();
      return bt - at;
    });
    return sorted.map((booking, i) => {
      const prev = i > 0 ? sorted[i - 1]! : null;
      return {
        ...booking,
        _isFirstInUserGroup:
          i === 0 || bookingUserKey(prev!) !== bookingUserKey(booking),
      } as AugmentedCreditBooking;
    });
  }, [bookings, showIndividualBookings]);

  const result = data?.oneFitCreditConsumption;
  const rows: CreditConsumptionRow[] = result?.rows ?? [];
  const totalCreditsConsumed = result?.totalCreditsConsumed ?? 0;
  const totalBookings = result?.totalBookings ?? 0;

  const handleExport = useCallback(() => {
    if (showIndividualBookings) {
      const headers = [
        'Name',
        'Phone',
        'Gender',
        'Birth',
        'Booked at',
        'Partner',
        'Class',
        'Price',
        'Plan',
        'Start',
        'End',
        'Credits',
        'Status',
      ];
      const dataRows = detailDisplayRows.map(individualReservationToCsvRow);
      const line = (r: (string | number)[]) => r.map(escapeCsvValue).join(',');
      const csvContent = `\uFEFF${headers.map(escapeCsvValue).join(',')}\n${dataRows
        .map((r) => line(r))
        .join('\n')}`;
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit-consumption-reservations-${startDate}-${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    const headers = [
      'Year',
      'Month',
      'Customer',
      'Phone',
      'Current credit balance',
      'Credits consumed',
      'Bookings',
      'Avg credits / booking',
    ];
    const dataRows = rows.map((row) => {
      const user = row.user;
      const fullName =
        user && (user.firstName || user.lastName)
          ? [user.firstName, user.lastName].filter(Boolean).join(' ')
          : '';
      const customerLabel =
        fullName || user?.primaryEmail || user?.primaryPhone || row.userId;
      const balance =
        typeof user?.currentCreditBalance === 'number'
          ? user.currentCreditBalance.toFixed(2)
          : '';
      const avg =
        row.bookingCount > 0
          ? (row.totalCreditsConsumed / row.bookingCount).toFixed(2)
          : '';
      return [
        row.year,
        row.month,
        customerLabel,
        user?.primaryPhone ?? '',
        balance,
        row.totalCreditsConsumed.toFixed(2),
        row.bookingCount,
        avg,
      ];
    });
    const csvContent = `\uFEFF${[
      headers.map(escapeCsvValue).join(','),
      ...dataRows.map((r) => r.map(escapeCsvValue).join(',')),
    ].join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit-consumption-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [rows, startDate, endDate, showIndividualBookings, detailDisplayRows]);

  /** Narrow layout: erxes RecordTable defaultColumn maxSize is 800px; we cap and shrink sizes. */
  /** Passed to RecordTable to override erxes defaultColumn.maxSize (800px). */
  const tableLayoutOptions = useMemo(
    () =>
      ({
        defaultColumn: {
          minSize: 40,
          maxSize: 160,
        },
      }) as const,
    [],
  );

  const aggregateColumns: ColumnDef<CreditConsumptionRow>[] = useMemo(
    () => [
      {
        id: 'year',
        accessorKey: 'year',
        header: 'Year',
        size: 64,
        cell: ({ cell }) => (
          <RecordTableInlineCell className="text-xs font-medium">
            {cell.getValue() as number}
          </RecordTableInlineCell>
        ),
      },
      {
        id: 'month',
        accessorKey: 'month',
        header: 'Month',
        size: 72,
        cell: ({ row }) => {
          const y = row.original.year;
          const m = String(row.original.month).padStart(2, '0');
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              {y}-{m}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'user',
        accessorKey: 'user',
        header: 'Customer',
        size: 140,
        maxSize: 200,
        cell: ({ row }) => {
          const user = row.original.user;
          const fullName =
            user && (user.firstName || user.lastName)
              ? [user.firstName, user.lastName].filter(Boolean).join(' ')
              : undefined;
          const label = fullName || user?.primaryEmail || user?.primaryPhone;
          return (
            <RecordTableInlineCell
              className="text-xs font-medium max-w-[10rem] truncate"
              title={String(label || row.original.userId)}
            >
              {label || row.original.userId}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'phone',
        header: 'Phone',
        size: 100,
        cell: ({ row }) => (
          <RecordTableInlineCell className="text-xs font-medium">
            {row.original.user?.primaryPhone ?? '—'}
          </RecordTableInlineCell>
        ),
      },
      {
        id: 'currentCreditBalance',
        header: 'Balance',
        size: 88,
        cell: ({ row }) => {
          const balance = row.original.user?.currentCreditBalance;
          const value = typeof balance === 'number' ? balance.toFixed(2) : '—';
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              {value}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'totalCreditsConsumed',
        accessorKey: 'totalCreditsConsumed',
        header: 'Credits',
        size: 80,
        cell: ({ cell }) => (
          <RecordTableInlineCell className="text-xs font-medium">
            {(cell.getValue() as number).toFixed(2)}
          </RecordTableInlineCell>
        ),
      },
      {
        id: 'bookingCount',
        accessorKey: 'bookingCount',
        header: '#',
        size: 56,
        cell: ({ cell }) => (
          <RecordTableInlineCell className="text-xs font-medium">
            {cell.getValue() as number}
          </RecordTableInlineCell>
        ),
      },
      {
        id: 'averageCreditsPerBooking',
        header: 'Avg / bkg',
        size: 80,
        cell: ({ row }) => {
          const { totalCreditsConsumed: credits, bookingCount } = row.original;
          const avg = bookingCount > 0 ? credits / bookingCount : 0;
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              {avg.toFixed(2)}
            </RecordTableInlineCell>
          );
        },
      },
    ],
    [],
  );

  /** Keep column width; avoid w-0 (broke column layout for later users). */
  const uBlank = 'text-xs p-1 min-h-[1.25rem]';
  const uTop = 'text-xs max-w-[5.5rem] truncate border-t border-border p-1';

  const mergedColumns: ColumnDef<AugmentedCreditBooking>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        size: 100,
        maxSize: 140,
        cell: ({ row }) => {
          const { _isFirstInUserGroup, user } = row.original;
          if (!_isFirstInUserGroup) {
            return <RecordTableInlineCell className={uBlank} />;
          }
          return (
            <RecordTableInlineCell
              className={uTop}
              title={getBookingUserDisplayName(user)}
            >
              {getBookingUserDisplayName(user)}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'phone',
        header: 'Phone',
        size: 90,
        maxSize: 110,
        cell: ({ row }) => {
          const { _isFirstInUserGroup, user } = row.original;
          if (!_isFirstInUserGroup) {
            return <RecordTableInlineCell className={uBlank} />;
          }
          return (
            <RecordTableInlineCell
              className={`${uTop} tabular-nums`}
              title={user?.primaryPhone ?? undefined}
            >
              {user?.primaryPhone ?? '—'}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'gender',
        header: 'Gender',
        size: 64,
        cell: ({ row }) => {
          const { _isFirstInUserGroup, user } = row.original;
          if (!_isFirstInUserGroup) {
            return <RecordTableInlineCell className={uBlank} />;
          }
          return (
            <RecordTableInlineCell className={`${uTop} capitalize`}>
              {formatCustomerSex(user?.sex ?? undefined)}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'birthDate',
        header: 'Birth',
        size: 88,
        cell: ({ row }) => {
          const { _isFirstInUserGroup, user } = row.original;
          if (!_isFirstInUserGroup) {
            return <RecordTableInlineCell className={uBlank} />;
          }
          return (
            <RecordTableInlineCell className={`${uTop} tabular-nums`}>
              {formatBirthDateYmd(user?.birthDate)}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'reservationDate',
        header: 'Booked at',
        size: 120,
        maxSize: 140,
        cell: ({ row }) => {
          const b = row.original;
          return (
            <RecordTableInlineCell className="text-xs p-1 font-medium tabular-nums max-w-[8.5rem] truncate">
              {formatReservationDateTime(b.createdAt, b.bookingDate)}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'partnerName',
        header: 'Partner',
        size: 120,
        maxSize: 160,
        cell: ({ row }) => {
          const name = row.original.provider?.businessName
            ? getLocalizedString(row.original.provider.businessName, detailLang)
            : '—';
          return (
            <RecordTableInlineCell
              className="text-xs p-1 font-medium max-w-[9rem] truncate"
              title={name !== '—' ? name : undefined}
            >
              {name}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'className',
        header: 'Class',
        size: 120,
        maxSize: 160,
        cell: ({ row }) => {
          const name = row.original.activityType?.name
            ? getLocalizedString(row.original.activityType.name, detailLang)
            : '—';
          return (
            <RecordTableInlineCell
              className="text-xs p-1 font-medium max-w-[9rem] truncate"
              title={name !== '—' ? name : undefined}
            >
              {name}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'price',
        header: 'Price',
        size: 72,
        cell: ({ row }) => {
          const p = row.original.price;
          const text =
            p == null || Number.isNaN(Number(p))
              ? '—'
              : Math.round(Number(p)).toLocaleString();
          return (
            <RecordTableInlineCell className="text-xs p-1 font-medium tabular-nums">
              {text}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'planLabel',
        header: 'Plan',
        size: 88,
        maxSize: 120,
        cell: ({ row }) => {
          const id = row.original.user?.oneFitMembershipPlanId;
          const t = id && String(id).trim() ? String(id) : '—';
          return (
            <RecordTableInlineCell
              className="text-xs p-1 font-medium max-w-[6.5rem] truncate"
              title={t !== '—' ? t : undefined}
            >
              {t}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'startDate',
        header: 'Start',
        size: 88,
        cell: ({ row }) => (
          <RecordTableInlineCell className="text-xs p-1 font-medium tabular-nums">
            {formatYmd(row.original.bookingDate)}
          </RecordTableInlineCell>
        ),
      },
      {
        id: 'endDate',
        header: 'End',
        size: 88,
        cell: ({ row }) => (
          <RecordTableInlineCell className="text-xs p-1 font-medium tabular-nums">
            {formatYmd(row.original.bookingDate)}
          </RecordTableInlineCell>
        ),
      },
      {
        id: 'credits',
        header: 'Cr.',
        size: 64,
        cell: ({ row }) => {
          const v = row.original.creditCost;
          const display =
            v === null || v === undefined ? '—' : Number(v).toFixed(2);
          return (
            <RecordTableInlineCell className="text-xs p-1 font-medium tabular-nums">
              {display}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'St.',
        size: 88,
        cell: ({ cell }) => {
          const status = cell.getValue() as BookingStatus;
          return (
            <RecordTableInlineCell className="p-0.5">
              <Badge
                variant={getStatusBadgeVariant(status)}
                className="h-5 max-w-[4.5rem] truncate px-1 py-0 text-[0.65rem] capitalize"
                title={getStatusLabel(status)}
              >
                {getStatusLabel(status)}
              </Badge>
            </RecordTableInlineCell>
          );
        },
      },
    ],
    [],
  );

  const showFooterTotals = !loadingAggregate && rows.length > 0;

  const showEmptyHint =
    !loadingAggregate && rows.length === 0 && startDate && endDate;

  const showBookingEmptyInMerged =
    showIndividualBookings &&
    allDetailBookingsLoaded &&
    bookings.length === 0 &&
    startDate &&
    endDate;

  const tableLoading = showIndividualBookings
    ? loadingBookings
    : loadingAggregate;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4">
      <div className="flex flex-shrink-0 flex-wrap items-end gap-4">
        <FilterField label="Start date">
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value || '')}
          />
        </FilterField>
        <FilterField label="End date">
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value || '')}
          />
        </FilterField>
        <FilterField label="Company" optional>
          <SelectCompany
            value={companyId}
            onValueChange={(value) => setCompanyId(value ?? '')}
          />
        </FilterField>
        <FilterField label="Plan" optional>
          <Select
            value={planId || '__all__'}
            onValueChange={(value) =>
              setPlanId(value === '__all__' ? '' : value)
            }
          >
            <Select.Trigger className="min-w-[220px]">
              <Select.Value placeholder="All plans" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="__all__">All plans</Select.Item>
              {activeMembershipPlans.map(
                (plan: { _id: string; name?: string }) => (
                  <Select.Item key={plan._id} value={plan._id}>
                    {plan.name || 'Unnamed plan'}
                  </Select.Item>
                ),
              )}
            </Select.Content>
          </Select>
        </FilterField>
        <div className="flex items-center gap-2 self-center pb-0.5">
          <Switch
            id="credit-consumption-show-bookings"
            checked={showIndividualBookings}
            onCheckedChange={setShowIndividualBookings}
          />
          <Label
            htmlFor="credit-consumption-show-bookings"
            className="font-normal whitespace-nowrap"
          >
            Show individual reservations
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={
            showIndividualBookings
              ? !allDetailBookingsLoaded || detailDisplayRows.length === 0
              : loadingAggregate || rows.length === 0
          }
          className="gap-2"
        >
          <IconDownload className="size-4" />
          Export CSV
        </Button>
        {showIndividualBookings &&
          loadingAllBookings &&
          bookings.length > 0 && (
            <p
              className="basis-full text-xs text-muted-foreground"
              role="status"
            >
              Loading all reservations…
            </p>
          )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border">
        <div className="min-h-0 flex-1 overflow-auto">
          <RecordTable.Provider
            tableOptions={tableLayoutOptions as never}
            columns={
              showIndividualBookings
                ? (mergedColumns as ColumnDef<unknown>[])
                : (aggregateColumns as ColumnDef<unknown>[])
            }
            data={
              showIndividualBookings
                ? (detailDisplayRows as unknown[])
                : (rows as unknown[])
            }
            className="m-0 w-full min-w-0 max-w-full"
          >
            {showIndividualBookings ? (
              <RecordTable.CursorProvider
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                dataLength={detailDisplayRows.length}
                sessionKey={CREDIT_CONSUMPTION_BOOKINGS_CURSOR_SESSION_KEY}
              >
                <RecordTable>
                  <RecordTable.Header />
                  <RecordTable.Body>
                    <RecordTable.CursorBackwardSkeleton
                      handleFetchMore={handleFetchMore}
                    />
                    {tableLoading && bookings.length === 0 && (
                      <RecordTable.RowSkeleton rows={10} />
                    )}
                    {!(tableLoading && bookings.length === 0) && (
                      <RecordTable.RowList />
                    )}
                    <RecordTable.CursorForwardSkeleton
                      handleFetchMore={handleFetchMore}
                    />
                  </RecordTable.Body>
                </RecordTable>
              </RecordTable.CursorProvider>
            ) : (
              <RecordTable>
                <RecordTable.Header />
                <RecordTable.Body>
                  {tableLoading && <RecordTable.RowSkeleton rows={10} />}
                  {!tableLoading && <RecordTable.RowList />}
                </RecordTable.Body>
              </RecordTable>
            )}
          </RecordTable.Provider>
        </div>
        {showFooterTotals && (
          <div className="border-t bg-muted/30 px-4 py-2 text-sm font-medium space-y-1 shrink-0">
            <div>Total credits consumed: {totalCreditsConsumed.toFixed(2)}</div>
            <div>Total bookings: {totalBookings}</div>
          </div>
        )}
      </div>

      {showEmptyHint && (
        <p className="text-sm text-muted-foreground">
          No completed or no-show bookings in the selected date range.
        </p>
      )}
      {showBookingEmptyInMerged && (
        <p className="text-sm text-muted-foreground">
          No individual reservations in the selected range.
        </p>
      )}
    </div>
  );
}
