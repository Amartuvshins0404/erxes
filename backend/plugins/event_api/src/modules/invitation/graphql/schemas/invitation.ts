import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  extend type Customer @key(fields: "_id") {
    _id: String! @external
  }

  enum INVITATION_STATUS {
    pending
    going
    maybe
    declined
  }

  type EventInvitation {
    _id: String!
    eventId: String
    event: Event
    customerId: String
    customer: Customer
    status: String
    source: String
    respondedAt: Date
    message: String
    sentAt: Date
    sentBy: String
    createdAt: Date
    updatedAt: Date
  }

  type EventInvitationListResponse {
    list: [EventInvitation]
    pageInfo: PageInfo
    totalCount: Int
  }

  type EventAttendanceCount {
    status: String
    count: Int
    percentage: Int
  }

  type EventAttendanceSummary {
    eventId: String
    total: Int
    counts: [EventAttendanceCount]
  }
`;

export const queries = `
  eventInvitations(eventId: String!, status: String, ${GQL_CURSOR_PARAM_DEFS}): EventInvitationListResponse
  eventAttendanceSummary(eventId: String!): EventAttendanceSummary

  cpEventInvitations: [EventInvitation]
`;

export const mutations = `
  eventInvitationsSend(_id: String!, title: String, message: String): JSON

  cpEventRespond(eventId: String!, status: INVITATION_STATUS!): EventInvitation
`;
