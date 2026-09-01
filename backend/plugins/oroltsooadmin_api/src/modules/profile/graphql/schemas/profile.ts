import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type OroltsooAdminProfileSocialLinks {
    facebook: String
    twitter: String
    instagram: String
    youtube: String
    website: String
  }

  type OroltsooAdminProfileContact {
    email: String
    phone: String
    address: String
    officeHours: String
    socialLinks: OroltsooAdminProfileSocialLinks
  }

  type OroltsooAdminProfilePromise {
    title: String
    description: String
    status: String
    progress: Int
  }


  type OroltsooAdminProfileLink {
    title: String
    url: String
    publishedAt: Date
  }

  type OroltsooAdminProfileBill {
    title: String
    stage: String
    role: String
    submittedAt: Date
    url: String
    description: String
  }

  type OroltsooAdminProfileDonation {
    donor: String
    amount: Float
    receivedAt: Date
    url: String
  }

  type OroltsooAdminProfileFinance {
    assetDeclarationUrl: String
    assetDeclarationDate: Date
    interestDeclarationUrl: String
    interestDeclarationDate: Date
    campaignExpense: Float
    campaignExpenseUrl: String
    donations: [OroltsooAdminProfileDonation]
    totalDonations: Float
  }

  type OroltsooAdminProfileAttendance {
    periodLabel: String
    sessionAttendanceRate: Float
    committeeAttendanceRate: Float
    attendedSessions: Int
    totalSessions: Int
    sourceUrl: String
  }

  type OroltsooAdminProfileEducation {
    school: String
    degree: String
    field: String
    startYear: Int
    endYear: Int
  }

  type OroltsooAdminProfileCareer {
    organization: String
    position: String
    startYear: Int
    endYear: Int
    description: String
  }

  type OroltsooAdminProfile @key(fields: "_id") {
    _id: String!
    subdomain: String
    entityId: String

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
    status: String

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
    reviewNote: String
    syncedAt: Date

    createdAt: Date
    updatedAt: Date
  }

  type OroltsooAdminProfileListResponse {
    list: [OroltsooAdminProfile]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const listParams = `
  searchValue: String
  subdomain: String
  reviewStatus: String
  party: String
  district: String
  syncedFrom: Date
  syncedTo: Date

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  oroltsooAdminProfiles(${listParams}): OroltsooAdminProfileListResponse
  oroltsooAdminProfileDetail(_id: String!): OroltsooAdminProfile
`;

export const mutations = `
  oroltsooAdminProfileVerify(_id: String!, note: String): OroltsooAdminProfile
  oroltsooAdminProfileReject(_id: String!, note: String): OroltsooAdminProfile
`;
