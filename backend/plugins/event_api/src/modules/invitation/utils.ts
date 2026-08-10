import { FilterQuery } from 'mongoose';
import {
  ATTENDANCE_STATUS_ORDER,
  InvitationStatus,
} from '@/invitation/constants';
import {
  IAttendanceSummary,
  IEventInvitationDocument,
  InvitationQueryParams,
} from '@/invitation/@types/invitation';

export const generateFilter = (
  params: InvitationQueryParams,
): FilterQuery<IEventInvitationDocument> => {
  const { eventId, status, customerId } = params;
  const filter: FilterQuery<IEventInvitationDocument> = { eventId };

  if (status) {
    filter.status = status;
  }

  if (customerId) {
    filter.customerId = customerId;
  }

  return filter;
};

export const buildAttendanceSummary = (
  eventId: string,
  grouped: { _id: string; count: number }[],
): IAttendanceSummary => {
  const countByStatus = new Map<string, number>(
    grouped.map(({ _id, count }) => [_id, count]),
  );

  const total = grouped.reduce((sum, { count }) => sum + count, 0);

  let allocated = 0;

  const counts = ATTENDANCE_STATUS_ORDER.map((status, index) => {
    const count = countByStatus.get(status) ?? 0;

    const isLast = index === ATTENDANCE_STATUS_ORDER.length - 1;
    const percentage = total
      ? isLast
        ? 100 - allocated
        : Math.round((count / total) * 100)
      : 0;

    allocated += percentage;

    return { status: status as InvitationStatus, count, percentage };
  });

  return { eventId, total, counts };
};
