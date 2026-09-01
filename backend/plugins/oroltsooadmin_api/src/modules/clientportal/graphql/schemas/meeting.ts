import { GQL_OFFSET_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type CpOroltsooMeeting {
    _id: String
    subdomain: String

    title: String
    location: String
    scheduledAt: Date
    note: String
    status: String
    source: String

    createdAt: Date
    updatedAt: Date
  }

  input CpOroltsooMeetingRequestInput {
    subdomain: String!
    title: String!
    scheduledAt: Date!
    location: String
    note: String
    contactName: String
    contactEmail: String
    contactPhone: String
  }
`;

const queryParams = `
  subdomain: String
  status: String
  scheduledFrom: Date
  scheduledTo: Date

  ${GQL_OFFSET_PARAM_DEFS}
`;

export const queries = `
  cpGetOroltsooMeetingRequests(${queryParams}): [CpOroltsooMeeting]
`;

export const mutations = `
  cpOroltsooMeetingRequestAdd(input: CpOroltsooMeetingRequestInput!): CpOroltsooMeeting
`;
