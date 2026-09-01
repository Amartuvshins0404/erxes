export const types = `
  type OroltsooProfileSocialLinks {
    facebook: String
    twitter: String
    instagram: String
    youtube: String
    website: String
  }

  type OroltsooProfileContact {
    email: String
    phone: String
    address: String
    officeHours: String
    socialLinks: OroltsooProfileSocialLinks
  }

  type OroltsooProfilePromise {
    title: String
    description: String
    status: String
    progress: Int
  }


  type OroltsooProfileLink {
    title: String
    url: String
    publishedAt: Date
  }

  type OroltsooProfileBill {
    title: String
    stage: String
    role: String
    submittedAt: Date
    url: String
    description: String
  }

  type OroltsooProfileDonation {
    donor: String
    amount: Float
    receivedAt: Date
    url: String
  }

  type OroltsooProfileFinance {
    assetDeclarationUrl: String
    assetDeclarationDate: Date
    interestDeclarationUrl: String
    interestDeclarationDate: Date
    campaignExpense: Float
    campaignExpenseUrl: String
    donations: [OroltsooProfileDonation]
    totalDonations: Float
  }

  type OroltsooProfileAttendance {
    periodLabel: String
    sessionAttendanceRate: Float
    committeeAttendanceRate: Float
    attendedSessions: Int
    totalSessions: Int
    sourceUrl: String
  }

  type OroltsooProfileEducation {
    school: String
    degree: String
    field: String
    startYear: Int
    endYear: Int
  }

  type OroltsooProfileCareer {
    organization: String
    position: String
    startYear: Int
    endYear: Int
    description: String
  }

  type OroltsooProfile @key(fields: "_id") {
    _id: String!
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

    education: [OroltsooProfileEducation]
    career: [OroltsooProfileCareer]

    achievements: String
    policyStance: String
    parliamentActivity: String
    votingSummary: String
    promises: [OroltsooProfilePromise]
    promiseProgress: Int
    bills: [OroltsooProfileBill]
    attendance: OroltsooProfileAttendance

    feedbackNote: String
    requestProcessNote: String

    transparencyNote: String
    reports: [OroltsooProfileLink]
    newsLinks: [OroltsooProfileLink]

    contact: OroltsooProfileContact
    finance: OroltsooProfileFinance

    reviewStatus: String
    reviewNote: String
    reviewedAt: Date

    createdAt: Date
    updatedAt: Date
  }

  input OroltsooProfileSocialLinksInput {
    facebook: String
    twitter: String
    instagram: String
    youtube: String
    website: String
  }

  input OroltsooProfileContactInput {
    email: String
    phone: String
    address: String
    officeHours: String
    socialLinks: OroltsooProfileSocialLinksInput
  }

  input OroltsooProfilePromiseInput {
    title: String!
    description: String
    status: String
    progress: Int
  }


  input OroltsooProfileLinkInput {
    title: String!
    url: String!
    publishedAt: Date
  }

  input OroltsooProfileBillInput {
    title: String!
    stage: String
    role: String
    submittedAt: Date
    url: String
    description: String
  }

  input OroltsooProfileDonationInput {
    donor: String!
    amount: Float
    receivedAt: Date
    url: String
  }

  input OroltsooProfileFinanceInput {
    assetDeclarationUrl: String
    assetDeclarationDate: Date
    interestDeclarationUrl: String
    interestDeclarationDate: Date
    campaignExpense: Float
    campaignExpenseUrl: String
    donations: [OroltsooProfileDonationInput]
  }

  input OroltsooProfileAttendanceInput {
    periodLabel: String
    sessionAttendanceRate: Float
    committeeAttendanceRate: Float
    attendedSessions: Int
    totalSessions: Int
    sourceUrl: String
  }

  input OroltsooProfileEducationInput {
    school: String!
    degree: String
    field: String
    startYear: Int
    endYear: Int
  }

  input OroltsooProfileCareerInput {
    organization: String!
    position: String!
    startYear: Int
    endYear: Int
    description: String
  }

  input OroltsooProfileInput {
    firstName: String!
    lastName: String
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

    education: [OroltsooProfileEducationInput]
    career: [OroltsooProfileCareerInput]

    achievements: String
    policyStance: String
    parliamentActivity: String
    votingSummary: String
    promises: [OroltsooProfilePromiseInput]
    bills: [OroltsooProfileBillInput]
    attendance: OroltsooProfileAttendanceInput

    feedbackNote: String
    requestProcessNote: String

    transparencyNote: String
    reports: [OroltsooProfileLinkInput]
    newsLinks: [OroltsooProfileLinkInput]

    contact: OroltsooProfileContactInput
    finance: OroltsooProfileFinanceInput
  }
`;

export const queries = `
  oroltsooProfileInfo: OroltsooProfile
`;

export const mutations = `
  oroltsooProfileUpdate(input: OroltsooProfileInput!): OroltsooProfile
`;
