import {
  Badge,
  Button,
  EnumCursorDirection,
  readImage,
  RelativeDateDisplay,
} from 'erxes-ui';
import moment from 'moment';
import 'moment/locale/mn';
import { useEffect } from 'react';
import { useBookings } from '../hooks/useBookings';
import { AttendanceStatus, BookingFilters } from '../types/booking';
import { BOOKINGS_LOG_CURSOR_SESSION_KEY } from '../constants/bookingCursorSessionKey';
import {
  ActivityLanguage,
  getLocalizedString,
} from '~/modules/activity-type/utils/localization';
import { OneFitCustomer } from '@/credit/types/credit';

interface BookingsLogProps {
  filters?: BookingFilters;
  preferredLanguage?: ActivityLanguage;
}

const getAttendanceBadgeVariant = (status: AttendanceStatus) => {
  switch (status) {
    case AttendanceStatus.ATTENDED:
      return 'success';
    case AttendanceStatus.NO_SHOW:
      return 'warning';
    case AttendanceStatus.PENDING:
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

export function BookingsLog({
  filters,
  preferredLanguage = 'en',
}: BookingsLogProps) {
  const mergedFilters: BookingFilters = {
    ...(filters || {}),
    attendanceStatus: AttendanceStatus.ATTENDED,
  };

  const { bookings, loading, pageInfo, handleFetchMore, refetch } = useBookings(
    mergedFilters,
    {
      sessionKey: BOOKINGS_LOG_CURSOR_SESSION_KEY,
      orderBy: { attendedAt: 'desc' },
    },
  );

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     refetch();
  //   }, 2000);

  //   return () => clearInterval(intervalId);
  // }, [refetch]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {loading && !bookings?.length && (
          <div className="text-sm text-muted-foreground">
            Loading attended bookings…
          </div>
        )}

        {bookings?.map((booking: any) => {
          const name = getDisplayName(
            booking.user as OneFitCustomer | undefined,
          );
          const provider = booking.provider;
          const providerName = provider?.businessName
            ? getLocalizedString(provider.businessName, preferredLanguage)
            : '-';
          const activityType = booking.activityType;
          const activityName = activityType?.name
            ? getLocalizedString(activityType.name, preferredLanguage)
            : '-';
          const activityImage = activityType?.image;

          const attendedAt = booking.attendedAt || booking.bookingDate;
          const isRecentlyAttended =
            moment().diff(moment(attendedAt), 'seconds') < 60;

          const initials = name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part: string) => part.charAt(0).toUpperCase())
            .join('');

          return (
            <div
              key={booking._id}
              className="flex gap-3 rounded-lg bg-muted px-3 py-2"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xs font-semibold">{name}</div>
                  <div className="text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                        isRecentlyAttended
                          ? 'bg-primary text-primary-foreground animate-pulse'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <span>{moment(attendedAt).locale('mn').fromNow()}</span>
                      <span
                        className={`text-[9px] font-medium normal-case ${
                          isRecentlyAttended
                            ? 'text-primary-foreground/90'
                            : 'text-primary/80'
                        }`}
                      >
                        QR уншуулсан цаг
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {booking.user?.primaryPhone && (
                    <span className="mr-1">{booking.user.primaryPhone}</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Booked for {booking.startTime} - {booking.endTime}
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  {activityImage && (
                    <img
                      src={readImage(activityImage)}
                      alt={activityName}
                      className="h-9 w-9 flex-shrink-0 rounded-md object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary leading-snug">
                      {activityName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {providerName}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={getAttendanceBadgeVariant(
                      booking.attendanceStatus,
                    )}
                    className="px-1.5 py-0 text-[10px] uppercase tracking-wide"
                  >
                    {getAttendanceLabel(
                      booking.attendanceStatus,
                      preferredLanguage,
                    )}
                  </Badge>
                  {booking.creditCost ? (
                    <span className="text-[11px] text-muted-foreground">
                      {booking.creditCost} credits
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {!loading && (!bookings || bookings.length === 0) && (
          <div className="text-sm text-muted-foreground">
            No attended bookings found.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage || loading}
          onClick={() =>
            handleFetchMore({ direction: EnumCursorDirection.BACKWARD })
          }
        >
          Newer
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage || loading}
          onClick={() =>
            handleFetchMore({ direction: EnumCursorDirection.FORWARD })
          }
        >
          Older
        </Button>
      </div>
    </div>
  );
}
