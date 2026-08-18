import {
  MutationFunctionOptions,
  useApolloClient,
  useMutation,
} from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_BOOKING_CREATE,
  ONE_FIT_BOOKING_CANCEL,
  ONE_FIT_BOOKING_MARK_ATTENDANCE,
  ONE_FIT_BOOKINGS_MARK_ATTENDANCE,
} from '../graphql/bookingMutations';
import { ONE_FIT_BOOKINGS } from '../graphql/bookingQueries';
import { AttendanceStatus } from '../types/booking';

export function useCreateBooking() {
  const [createBookingMutation, { loading }] = useMutation(
    ONE_FIT_BOOKING_CREATE,
  );

  const createBooking = (options: MutationFunctionOptions) => {
    return createBookingMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_BOOKINGS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Booking created successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { createBooking, loading };
}

export function useCancelBooking() {
  const [cancelBookingMutation, { loading }] = useMutation(
    ONE_FIT_BOOKING_CANCEL,
  );

  const cancelBooking = (options: MutationFunctionOptions) => {
    return cancelBookingMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_BOOKINGS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Booking cancelled successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { cancelBooking, loading };
}

export function useMarkAttendance() {
  const [markAttendanceMutation, { loading }] = useMutation(
    ONE_FIT_BOOKING_MARK_ATTENDANCE,
  );

  const markAttendance = (
    bookingId: string,
    attendanceStatus: AttendanceStatus,
    options?: { skipToast?: boolean },
  ) => {
    const skipToast = options?.skipToast ?? false;
    return markAttendanceMutation({
      variables: {
        _id: bookingId,
        attendanceStatus,
      },
      refetchQueries: [{ query: ONE_FIT_BOOKINGS }],
      onCompleted: () => {
        if (!skipToast) {
          toast({
            title: 'Success',
            description: 'Attendance marked successfully',
          });
        }
      },
      onError: (error) => {
        if (!skipToast) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  return { markAttendance, loading };
}

export type MarkAttendanceBulkResult =
  | { success: true; count: number }
  | { success: false; error: string };

export function useMarkAttendanceBulk() {
  const client = useApolloClient();
  const [markAttendancesMutation, { loading }] = useMutation(
    ONE_FIT_BOOKINGS_MARK_ATTENDANCE,
    { refetchQueries: [] },
  );

  const markAttendanceBulk = async (
    bookingIds: string[],
    options?: { skipToast?: boolean },
  ): Promise<MarkAttendanceBulkResult | undefined> => {
    if (bookingIds.length === 0) return undefined;
    const skipToast = options?.skipToast ?? false;
    try {
      const result = await markAttendancesMutation({
        variables: {
          ids: bookingIds,
          attendanceStatus: AttendanceStatus.ATTENDED,
        },
      });
      const updated = result.data?.oneFitBookingsMarkAttendance ?? [];
      await client.refetchQueries({ include: [ONE_FIT_BOOKINGS] });
      const count = updated.length || 0;
      if (!skipToast) {
        toast({
          title: 'Амжилттай',
          description:
            count === 1
              ? '1 захиалга ирсэн гэж тэмдэглэгдлээ.'
              : `${count} захиалга ирсэн гэж тэмдэглэгдлээ.`,
        });
      }
      return { success: true, count };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ирцийг тэмдэглэж чадсангүй';
      if (!skipToast) {
        toast({
          title: 'Алдаа',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      return { success: false, error: errorMessage };
    }
  };

  return { markAttendanceBulk, loading };
}
