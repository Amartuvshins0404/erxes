import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Badge, Button, ScrollArea, Tooltip } from 'erxes-ui';
import {
  IconBan,
  IconCalendarOff,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
} from '@tabler/icons-react';
import { useBookingsForMonth } from '../hooks/useBookingsForMonth';
import { useMonthAvailability } from '../hooks/useMonthAvailability';
import { BookingFilters, BookingStatus, OneFitBooking } from '../types/booking';
import type { OneFitDayAvailability } from '../types/schedule';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { BookingDetailDialog } from './BookingDetailDialog';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_BOOKINGS_PER_CELL = 3;

function getCustomerDisplayName(booking: OneFitBooking): string {
  const u = booking.user;
  if (!u) return '—';
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
  if (name) return name;
  if (u.primaryEmail) return u.primaryEmail;
  if (u.primaryPhone) return u.primaryPhone;
  return '—';
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

function groupBookingsByDay(
  bookings: OneFitBooking[],
): Map<number, OneFitBooking[]> {
  const map = new Map<number, OneFitBooking[]>();
  for (const b of bookings) {
    const d = startOfDay(
      typeof b.bookingDate === 'string'
        ? parseISO(b.bookingDate)
        : new Date(b.bookingDate),
    ).getTime();
    const list = map.get(d) ?? [];
    list.push(b);
    map.set(d, list);
  }
  return map;
}

function ScheduleStatusIndicator({
  availability,
}: {
  availability: OneFitDayAvailability;
}) {
  const { isBlockedByException, hasSchedule, seatsLeft } = availability;
  if (isBlockedByException) {
    return (
      <Tooltip>
        <Tooltip.Trigger asChild>
          <span className="text-destructive inline-flex cursor-default">
            <IconBan className="h-3.5 w-3.5" />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>Blocked by exception</Tooltip.Content>
      </Tooltip>
    );
  }
  if (!hasSchedule) {
    return (
      <Tooltip>
        <Tooltip.Trigger asChild>
          <span className="text-muted-foreground inline-flex cursor-default">
            <IconCalendarOff className="h-3.5 w-3.5" />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>No schedule</Tooltip.Content>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <span className="text-green-600 dark:text-green-500 inline-flex cursor-default">
          <IconCircleCheck className="h-3.5 w-3.5" />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>Has schedule – {seatsLeft} seats left</Tooltip.Content>
    </Tooltip>
  );
}

interface BookingsCalendarProps {
  filters?: BookingFilters;
}

export function BookingsCalendar({ filters }: BookingsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedBooking, setSelectedBooking] = useState<OneFitBooking | null>(
    null,
  );
  const { bookings, loading, error } = useBookingsForMonth(
    currentMonth,
    filters,
  );
  const { daysByDate } = useMonthAvailability(
    currentMonth,
    filters?.providerId,
    filters?.activityTypeId,
  );
  const hasAvailabilityData =
    Boolean(filters?.providerId && filters?.activityTypeId) &&
    daysByDate.size > 0;

  const { calendarDays, bookingsByDay } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const PADDED_LENGTH = 42;
    const paddedDays: (Date | null)[] = [...days];
    while (paddedDays.length < PADDED_LENGTH) {
      paddedDays.push(null);
    }
    const byDay = groupBookingsByDay(bookings);
    return { calendarDays: paddedDays, bookingsByDay: byDay };
  }, [currentMonth, bookings]);

  if (error) {
    return (
      <div className="p-4 text-destructive text-sm">
        Failed to load bookings: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-4 p-2 border-b shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        >
          <IconChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold tabular-nums">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >
          <IconChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div
            className="grid w-full min-w-[600px]"
            style={{
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gridTemplateRows: 'auto repeat(6, minmax(100px, 1fr))',
            }}
          >
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="p-2 text-center text-muted-foreground text-xs font-medium border-b border-r border-border last:border-r-0 bg-muted/30"
              >
                {label}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="border-b border-r border-border last:border-r-0 bg-muted/10 min-h-[100px]"
                  />
                );
              }
              const dayKey = startOfDay(day).getTime();
              const dayBookings = bookingsByDay.get(dayKey) ?? [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const availability =
                isCurrentMonth && hasAvailabilityData
                  ? daysByDate.get(dayKey)
                  : undefined;

              return (
                <div
                  key={dayKey}
                  className={`border-b border-r border-border last:border-r-0 bg-background p-1.5 flex flex-col min-h-[100px] ${
                    !isCurrentMonth ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-0.5 shrink-0">
                    <span
                      className={`inline-flex items-center justify-center text-sm font-medium w-7 h-7 ${
                        isTodayDate
                          ? 'bg-primary text-primary-foreground rounded-full'
                          : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {availability && (
                      <ScheduleStatusIndicator availability={availability} />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col gap-0.5 mt-1 min-h-0">
                    {dayBookings
                      .slice(0, MAX_VISIBLE_BOOKINGS_PER_CELL)
                      .map((booking) => (
                        <button
                          type="button"
                          key={booking._id}
                          onClick={() => setSelectedBooking(booking)}
                          className="text-xs truncate rounded px-1.5 py-0.5 bg-muted/80 flex items-center gap-1 flex-wrap w-full text-left hover:bg-muted cursor-pointer transition-colors"
                          title={`${getCustomerDisplayName(booking)} · ${getStatusLabel(booking.status)}${booking.activityType ? ` · ${getLocalizedString(booking.activityType.name)}` : ''} · Click for details`}
                        >
                          <span className="font-medium truncate min-w-0">
                            {getCustomerDisplayName(booking)}
                          </span>
                          <Badge
                            variant={getStatusBadgeVariant(booking.status)}
                            className="text-[10px] px-1 py-0 shrink-0"
                          >
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </button>
                      ))}
                    {dayBookings.length > MAX_VISIBLE_BOOKINGS_PER_CELL && (
                      <span className="text-xs text-muted-foreground px-1 shrink-0">
                        +{dayBookings.length - MAX_VISIBLE_BOOKINGS_PER_CELL}{' '}
                        more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      />
    </div>
  );
}
