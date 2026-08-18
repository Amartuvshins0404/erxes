import { gql } from '@apollo/client';

export const ONE_FIT_SCHEDULE_COVERAGE_SUMMARY = gql`
  query OneFitScheduleCoverageSummary(
    $providerId: String
    $activityTypeId: String
    $year: Int!
    $month: Int!
  ) {
    oneFitScheduleCoverageSummary(
      providerId: $providerId
      activityTypeId: $activityTypeId
      year: $year
      month: $month
    ) {
      providerId
      providerIsActive
      providerStatus
      provider {
        _id
        businessName {
          en
          mn
        }
        isActive
      }
      activityTypeId
      activityType {
        _id
        name {
          en
          mn
        }
      }
      year
      month
      hasTemplate
      hasAnySchedule
      missingDaysCount
      templateId
    }
  }
`;

