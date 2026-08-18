import { gql } from '@apollo/client';

export const ONE_FIT_SCHEDULE_TEMPLATE_CREATE = gql`
  mutation OneFitScheduleTemplateCreate(
    $providerId: String!
    $month: Int!
    $year: Int!
    $dailySchedules: [OneFitDailyScheduleInput]!
  ) {
    oneFitScheduleTemplateCreate(
      providerId: $providerId
      month: $month
      year: $year
      dailySchedules: $dailySchedules
    ) {
      _id
      createdAt
      modifiedAt
      providerId
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

export const ONE_FIT_SCHEDULE_TEMPLATE_UPDATE = gql`
  mutation OneFitScheduleTemplateUpdate(
    $_id: String!
    $dailySchedules: [OneFitDailyScheduleInput]
  ) {
    oneFitScheduleTemplateUpdate(_id: $_id, dailySchedules: $dailySchedules) {
      _id
      modifiedAt
      providerId
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

export const ONE_FIT_SCHEDULE_TEMPLATE_COPY_PREVIOUS_MONTH = gql`
  mutation OneFitScheduleTemplateCopyPreviousMonth(
    $providerIds: [String]!
    $fromYear: Int!
    $fromMonth: Int!
    $toYear: Int!
    $toMonth: Int!
  ) {
    oneFitScheduleTemplateCopyPreviousMonth(
      providerIds: $providerIds
      fromYear: $fromYear
      fromMonth: $fromMonth
      toYear: $toYear
      toMonth: $toMonth
    ) {
      templates {
        _id
        createdAt
        modifiedAt
        providerId
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
      skippedProviderIds
    }
  }
`;

export const ONE_FIT_SCHEDULE_TEMPLATES_REMOVE = gql`
  mutation OneFitScheduleTemplatesRemove($ids: [String]!) {
    oneFitScheduleTemplatesRemove(ids: $ids)
  }
`;

export const ONE_FIT_SCHEDULE_EXCEPTION_CREATE = gql`
  mutation OneFitScheduleExceptionCreate(
    $providerId: String!
    $date: Date!
    $reason: String
  ) {
    oneFitScheduleExceptionCreate(
      providerId: $providerId
      date: $date
      reason: $reason
    ) {
      _id
      createdAt
      providerId
      date
      reason
    }
  }
`;

export const ONE_FIT_SCHEDULE_EXCEPTION_REMOVE = gql`
  mutation OneFitScheduleExceptionRemove($_id: String!) {
    oneFitScheduleExceptionRemove(_id: $_id)
  }
`;

export const ONE_FIT_SCHEDULE_EXCEPTIONS_REMOVE = gql`
  mutation OneFitScheduleExceptionsRemove($ids: [String]!) {
    oneFitScheduleExceptionsRemove(ids: $ids)
  }
`;
