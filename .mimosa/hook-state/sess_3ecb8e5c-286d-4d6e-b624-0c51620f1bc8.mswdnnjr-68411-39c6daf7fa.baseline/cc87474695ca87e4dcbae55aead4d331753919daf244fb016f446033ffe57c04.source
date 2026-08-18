import { gql } from '@apollo/client';

export const ONE_FIT_MONTH_AVAILABILITY = gql`
  query OneFitMonthAvailability(
    $providerId: String!
    $activityTypeId: String!
    $year: Int!
    $month: Int!
    $lastDays: Int
  ) {
    oneFitMonthAvailability(
      providerId: $providerId
      activityTypeId: $activityTypeId
      year: $year
      month: $month
      lastDays: $lastDays
    ) {
      year
      month
      days {
        date
        hasSchedule
        isBlockedByException
        isFull
        seatsLeft
        totalSeats
        bookedSeats
        schedule {
          dayOfWeek
          activityTypeId
          startTime
          endTime
          dailyLimit
        }
      }
    }
  }
`;
