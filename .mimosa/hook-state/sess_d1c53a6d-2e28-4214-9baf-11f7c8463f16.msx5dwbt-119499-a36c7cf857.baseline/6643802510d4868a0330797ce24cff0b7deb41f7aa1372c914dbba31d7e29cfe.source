import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_BOOKINGS = gql`
  query OneFitBookings(
    $userId: String
    $providerId: String
    $activityTypeId: String
    $bookingDate: Date
    $startDate: Date
    $endDate: Date
    $status: OneFitBookingStatus
    $attendanceStatus: OneFitAttendanceStatus
    $bookingId: String
    ${GQL_CURSOR_PARAM_DEFS}
    $orderBy: JSON
  ) {
    oneFitBookings(
      userId: $userId
      providerId: $providerId
      activityTypeId: $activityTypeId
      bookingDate: $bookingDate
      startDate: $startDate
      endDate: $endDate
      status: $status
      attendanceStatus: $attendanceStatus
      bookingId: $bookingId
      orderBy: $orderBy
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        modifiedAt
        userId
        providerId
        activityTypeId
        user {
          _id
          firstName
          lastName
          primaryEmail
          primaryPhone
        }
        provider {
          _id
          businessName {
            en
            mn
          }
        }
        activityType {
          _id
          name {
            en
            mn
          }
          image
        }
        bookingDate
        startTime
        endTime
        creditCost
        price
        status
        attendanceStatus
        bookingId
        cancelledAt
        cancelledBy
        cancellationReason
        attendedAt
        markedBy
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const ONE_FIT_BOOKINGS_COUNT = gql`
  query OneFitBookingsCount(
    $userId: String
    $providerId: String
    $activityTypeId: String
    $bookingDate: Date
    $startDate: Date
    $endDate: Date
    $status: OneFitBookingStatus
    $attendanceStatus: OneFitAttendanceStatus
    $bookingId: String
  ) {
    oneFitBookingsCount(
      userId: $userId
      providerId: $providerId
      activityTypeId: $activityTypeId
      bookingDate: $bookingDate
      startDate: $startDate
      endDate: $endDate
      status: $status
      attendanceStatus: $attendanceStatus
      bookingId: $bookingId
    )
  }
`;

export const ONE_FIT_BOOKING = gql`
  query OneFitBooking($_id: String!) {
    oneFitBooking(_id: $_id) {
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
      cancelledAt
      cancelledBy
      cancellationReason
      attendedAt
      markedBy
    }
  }
`;

export const ONE_FIT_BOOKING_BY_BOOKING_ID = gql`
  query OneFitBookingByBookingId($bookingId: String!) {
    oneFitBookingByBookingId(bookingId: $bookingId) {
      _id
      createdAt
      modifiedAt
      userId
      providerId
      activityTypeId
      user {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
      provider {
        _id
        businessName {
          en
          mn
        }
      }
      activityType {
        _id
        name {
          en
          mn
        }
        image
      }
      bookingDate
      startTime
      endTime
      creditCost
      status
      attendanceStatus
      bookingId
      cancelledAt
      cancelledBy
      cancellationReason
      attendedAt
      markedBy
    }
  }
`;

export const ONE_FIT_CREDIT_CONSUMPTION = gql`
  query OneFitCreditConsumption(
    $startDate: Date!
    $endDate: Date!
    $providerId: String
    $userId: String
    $companyId: String
    $planId: String
  ) {
    oneFitCreditConsumption(
      startDate: $startDate
      endDate: $endDate
      providerId: $providerId
      userId: $userId
      companyId: $companyId
      planId: $planId
    ) {
      rows {
        year
        month
        userId
        user
        totalCreditsConsumed
        bookingCount
      }
      totalCreditsConsumed
      totalBookings
    }
  }
`;

export const ONE_FIT_CREDIT_CONSUMPTION_BOOKINGS = gql`
  query OneFitCreditConsumptionBookings(
    $startDate: Date!
    $endDate: Date!
    $providerId: String
    $userId: String
    $companyId: String
    $planId: String
    ${GQL_CURSOR_PARAM_DEFS}
    $orderBy: JSON
  ) {
    oneFitCreditConsumptionBookings(
      startDate: $startDate
      endDate: $endDate
      providerId: $providerId
      userId: $userId
      companyId: $companyId
      planId: $planId
      orderBy: $orderBy
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        userId
        createdAt
        user {
          _id
          firstName
          lastName
          primaryEmail
          primaryPhone
          sex
          birthDate
          oneFitMembershipPlanId
        }
        provider {
          _id
          businessName {
            en
            mn
          }
        }
        activityType {
          _id
          name {
            en
            mn
          }
        }
        bookingDate
        startTime
        endTime
        creditCost
        price
        status
        bookingId
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
