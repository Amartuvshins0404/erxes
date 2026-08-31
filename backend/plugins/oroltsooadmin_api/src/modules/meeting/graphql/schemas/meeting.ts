import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type OroltsooAdminMeeting @key(fields: "_id") {
    _id: String!
    subdomain: String

    title: String
    location: String
    scheduledAt: Date
    note: String
    status: String
    source: String
    requestedBy: OroltsooAdminMeetingRequester

    createdAt: Date
    updatedAt: Date
  }

  type OroltsooAdminMeetingRequester {
    cpUserId: String
    name: String
    email: String
    phone: String
  }

  type OroltsooAdminMeetingListResponse {
    list: [OroltsooAdminMeeting]
    pageInfo: PageInfo
    totalCount: Int
  }

  input OroltsooAdminMeetingInput {
    title: String!
    location: String
    scheduledAt: Date
    note: String
    status: String
  }
`;

const listParams = `
  searchValue: String
  subdomain: String
  status: String
  source: String
  scheduledFrom: Date
  scheduledTo: Date

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  oroltsooAdminMeetings(${listParams}): OroltsooAdminMeetingListResponse
  oroltsooAdminMeetingDetail(_id: String!): OroltsooAdminMeeting
`;

export const mutations = `
  oroltsooAdminMeetingAdd(subdomain: String!, input: OroltsooAdminMeetingInput!): OroltsooAdminMeeting
  oroltsooAdminMeetingEdit(_id: String!, input: OroltsooAdminMeetingInput!): OroltsooAdminMeeting
  oroltsooAdminMeetingRemove(_ids: [String!]!): JSON
`;
