import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_SCHEDULE_TEMPLATES = gql`
  query OneFitScheduleTemplates(
    $providerId: String
    $year: Int
    $month: Int
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitScheduleTemplates(
      providerId: $providerId
      year: $year
      month: $month
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        modifiedAt
        providerId
        provider {
          _id
          businessName {
            en
            mn
          }
        }
        month
        year
        dailySchedules {
          dayOfWeek
          activityTypeId
          genderRestriction
          startTime
          endTime
          dailyLimit
        }
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

export const ONE_FIT_SCHEDULE_TEMPLATES_COUNT = gql`
  query OneFitScheduleTemplatesCount(
    $providerId: String
    $year: Int
    $month: Int
  ) {
    oneFitScheduleTemplatesCount(
      providerId: $providerId
      year: $year
      month: $month
    )
  }
`;

export const ONE_FIT_SCHEDULE_TEMPLATE = gql`
  query OneFitScheduleTemplate($_id: String!) {
    oneFitScheduleTemplate(_id: $_id) {
      _id
      createdAt
      modifiedAt
      providerId
      provider {
        _id
        businessName {
          en
          mn
        }
      }
      month
      year
      dailySchedules {
        dayOfWeek
        activityTypeId
        genderRestriction
        startTime
        endTime
        dailyLimit
      }
    }
  }
`;

export const ONE_FIT_SCHEDULE_TEMPLATE_BY_PROVIDER_AND_MONTH = gql`
  query OneFitScheduleTemplateByProviderAndMonth(
    $providerId: String!
    $year: Int!
    $month: Int!
  ) {
    oneFitScheduleTemplateByProviderAndMonth(
      providerId: $providerId
      year: $year
      month: $month
    ) {
      _id
      createdAt
      modifiedAt
      providerId
      provider {
        _id
        businessName {
          en
          mn
        }
      }
      month
      year
      dailySchedules {
        dayOfWeek
        activityTypeId
        genderRestriction
        startTime
        endTime
        dailyLimit
      }
    }
  }
`;

export const ONE_FIT_SCHEDULE_EXCEPTIONS = gql`
  query OneFitScheduleExceptions(
    $providerId: String
    $startDate: Date
    $endDate: Date
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitScheduleExceptions(
      providerId: $providerId
      startDate: $startDate
      endDate: $endDate
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        providerId
        provider {
          _id
          businessName {
            en
            mn
          }
        }
        date
        reason
        activityTypeId
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

export const ONE_FIT_SCHEDULE_EXCEPTIONS_COUNT = gql`
  query OneFitScheduleExceptionsCount(
    $providerId: String!
    $startDate: Date
    $endDate: Date
  ) {
    oneFitScheduleExceptionsCount(
      providerId: $providerId
      startDate: $startDate
      endDate: $endDate
    )
  }
`;

export const ONE_FIT_SCHEDULE_EXCEPTION = gql`
  query OneFitScheduleException($_id: String!) {
    oneFitScheduleException(_id: $_id) {
      _id
      createdAt
      providerId
      provider {
        _id
        businessName {
          en
          mn
        }
      }
      date
      reason
      activityTypeId
    }
  }
`;
