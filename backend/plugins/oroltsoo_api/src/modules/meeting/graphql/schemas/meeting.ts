import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type OroltsooMeeting @key(fields: "_id") {
    _id: String!
    title: String
    location: String
    scheduledAt: Date
    note: String
    status: String
    createdAt: Date
    updatedAt: Date
  }

  type OroltsooMeetingListResponse {
    list: [OroltsooMeeting]
    pageInfo: PageInfo
    totalCount: Int
  }

`;

const listParams = `
  searchValue: String
  status: String
  scheduledFrom: Date
  scheduledTo: Date

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  oroltsooMeetings(${listParams}): OroltsooMeetingListResponse
  oroltsooMeetingDetail(_id: String!): OroltsooMeeting
`;

