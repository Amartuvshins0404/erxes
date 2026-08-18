import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS, GQL_PAGE_INFO } from 'erxes-ui';

const EVENT_FIELDS = `
  _id
  name
  description
  coverImage
  images
  videoUrl
  startDate
  endDate
  location {
    city
    district
    address
    lat
    lng
  }
  isOnline
  onlineUrl
  capacity
  status
  goingCount
  ownerId
  agenda {
    startTime
    endTime
    title
    description
  }
  createdAt
  updatedAt
`;

const EVENT_PARAM_DEFS = `
  $searchValue: String
  $status: String
  $tab: EVENT_TAB
  $startDateFrom: Date
  $startDateTo: Date
  ${GQL_CURSOR_PARAM_DEFS}
`;

const EVENT_PARAMS = `
  searchValue: $searchValue
  status: $status
  tab: $tab
  startDateFrom: $startDateFrom
  startDateTo: $startDateTo
  ${GQL_CURSOR_PARAMS}
`;

export const EVENTS = gql`
  query Events(${EVENT_PARAM_DEFS}) {
    events(${EVENT_PARAMS}) {
      list { ${EVENT_FIELDS} }
      totalCount
      ${GQL_PAGE_INFO}
    }
  }
`;

export const EVENT_DETAIL = gql`
  query EventDetail($_id: String!) {
    eventDetail(_id: $_id) { ${EVENT_FIELDS} }
  }
`;

export const EVENT_ATTENDANCE_SUMMARY = gql`
  query EventAttendanceSummary($eventId: String!) {
    eventAttendanceSummary(eventId: $eventId) {
      eventId
      total
      counts {
        status
        count
        percentage
      }
    }
  }
`;

export const EVENT_INVITATIONS = gql`
  query EventInvitations(
    $eventId: String!
    $status: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    eventInvitations(
      eventId: $eventId
      status: $status
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        eventId
        customerId
        status
        source
        respondedAt
        createdAt
        customer {
          _id
          firstName
          lastName
          primaryEmail
          avatar
        }
      }
      totalCount
      ${GQL_PAGE_INFO}
    }
  }
`;
