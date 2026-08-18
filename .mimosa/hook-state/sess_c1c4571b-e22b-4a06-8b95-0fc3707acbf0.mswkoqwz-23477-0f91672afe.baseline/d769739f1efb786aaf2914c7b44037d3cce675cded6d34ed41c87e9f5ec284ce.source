import { gql } from '@apollo/client';

export const ONE_FIT_BOOKING_CREATE = gql`
  mutation OneFitBookingCreate(
    $userId: String!
    $activityTypeId: String!
    $bookingDate: Date!
    $startTime: String!
    $endTime: String!
  ) {
    oneFitBookingCreate(
      userId: $userId
      activityTypeId: $activityTypeId
      bookingDate: $bookingDate
      startTime: $startTime
      endTime: $endTime
    ) {
      _id
      createdAt
      modifiedAt
      userId
      providerId
      activityTypeId
      bookingDate
      startTime
      endTime
      creditCost
      status
      attendanceStatus
      bookingId
    }
  }
`;

export const ONE_FIT_BOOKING_CANCEL = gql`
  mutation OneFitBookingCancel($_id: String!, $reason: String) {
    oneFitBookingCancel(_id: $_id, reason: $reason) {
      _id
      status
      cancelledAt
      cancelledBy
      cancellationReason
    }
  }
`;

export const ONE_FIT_BOOKING_MARK_ATTENDANCE = gql`
  mutation OneFitBookingMarkAttendance(
    $_id: String!
    $attendanceStatus: OneFitAttendanceStatus!
  ) {
    oneFitBookingMarkAttendance(
      _id: $_id
      attendanceStatus: $attendanceStatus
    ) {
      _id
      attendanceStatus
      attendedAt
      markedBy
    }
  }
`;

export const ONE_FIT_BOOKINGS_MARK_ATTENDANCE = gql`
  mutation OneFitBookingsMarkAttendance(
    $ids: [String!]!
    $attendanceStatus: OneFitAttendanceStatus!
  ) {
    oneFitBookingsMarkAttendance(
      ids: $ids
      attendanceStatus: $attendanceStatus
    ) {
      _id
      attendanceStatus
      attendedAt
      markedBy
    }
  }
`;
