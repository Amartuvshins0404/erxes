import { useQuery } from '@apollo/client';
import {
  EVENT_ATTENDANCE_SUMMARY,
  EVENT_DETAIL,
} from '@/events/graphql/queries';
import { IAttendanceSummary, IEvent } from '~/types/event';

export const useEventDetail = (_id?: string | null) => {
  const { data, loading, error } = useQuery<{ eventDetail: IEvent }>(
    EVENT_DETAIL,
    { variables: { _id }, skip: !_id },
  );

  return { event: data?.eventDetail ?? null, loading, error };
};

export const useAttendanceSummary = (eventId?: string | null) => {
  const { data, loading, error } = useQuery<{
    eventAttendanceSummary: IAttendanceSummary;
  }>(EVENT_ATTENDANCE_SUMMARY, { variables: { eventId }, skip: !eventId });

  return {
    summary: data?.eventAttendanceSummary ?? null,
    loading,
    error,
  };
};
