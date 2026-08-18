import { useQuery } from '@apollo/client';
import {
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ONE_FIT_BOOKINGS } from '../graphql/bookingQueries';
import { BookingFilters } from '../types/booking';

const CALENDAR_MONTH_LIMIT = 100;

export function useBookingsForMonth(month: Date, filters?: BookingFilters) {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);

  const { userId, providerId, activityTypeId, status, attendanceStatus } =
    filters ?? {};
  const { data, loading, error } = useQuery(ONE_FIT_BOOKINGS, {
    variables: {
      userId,
      providerId,
      activityTypeId,
      status,
      attendanceStatus,
      startDate,
      endDate,
      limit: CALENDAR_MONTH_LIMIT,
    },
  });

  const bookings = data?.oneFitBookings?.list ?? [];

  return {
    bookings,
    loading,
    error,
  };
}
