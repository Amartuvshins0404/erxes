import { GQL_OFFSET_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type CpOroltsooProfile {
    _id: String
    subdomain: String

    firstName: String
    lastName: String
    fullName: String
    avatar: String
    coverImage: String

    position: String
    party: String
    organization: String
    district: String
    territory: String
    mandateType: String
    termStart: Date
    termEnd: Date

    introduction: String
    positionDescription: String
    territoryDescription: String

    education: [OroltsooAdminProfileEducation]
    career: [OroltsooAdminProfileCareer]

    achievements: String
    policyStance: String
    parliamentActivity: String
    votingSummary: String
    promises: [OroltsooAdminProfilePromise]
    promiseProgress: Int
    bills: [OroltsooAdminProfileBill]
    attendance: OroltsooAdminProfileAttendance

    feedbackNote: String
    requestProcessNote: String

    transparencyNote: String
    reports: [OroltsooAdminProfileLink]
    newsLinks: [OroltsooAdminProfileLink]

    contact: OroltsooAdminProfileContact
    finance: OroltsooAdminProfileFinance

    reviewStatus: String

    createdAt: Date
    updatedAt: Date
  }
`;

const queryParams = `
  searchValue: String
  subdomain: String
  party: String
  district: String
  mandateType: String
  reviewStatus: String

  ${GQL_OFFSET_PARAM_DEFS}
`;

export const queries = `
  cpGetOroltsooProfiles(${queryParams}): [CpOroltsooProfile]
  cpGetOroltsooProfile(_id: String!): CpOroltsooProfile
`;
