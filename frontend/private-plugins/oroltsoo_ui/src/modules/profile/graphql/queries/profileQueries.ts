import { gql } from '@apollo/client';

const PROFILE_FIELDS = `
  _id
  firstName
  lastName
  fullName
  avatar
  coverImage

  position
  party
  organization
  district
  territory
  mandateType
  termStart
  termEnd
  status
  reviewStatus
  reviewNote
  reviewedAt

  introduction
  positionDescription
  territoryDescription

  education {
    school
    degree
    field
    startYear
    endYear
  }
  career {
    organization
    position
    startYear
    endYear
    description
  }

  achievements
  policyStance
  parliamentActivity
  votingSummary
  promiseProgress
  promises {
    title
    description
    status
    progress
  }
  bills {
    title
    stage
    role
    submittedAt
    url
    description
  }
  attendance {
    periodLabel
    sessionAttendanceRate
    committeeAttendanceRate
    attendedSessions
    totalSessions
    sourceUrl
  }

  feedbackNote
  requestProcessNote

  transparencyNote
  reports {
    title
    url
    publishedAt
  }
  newsLinks {
    title
    url
    publishedAt
  }

  contact {
    email
    phone
    address
    officeHours
    socialLinks {
      facebook
      twitter
      instagram
      youtube
      website
    }
  }
  finance {
    assetDeclarationUrl
    assetDeclarationDate
    interestDeclarationUrl
    interestDeclarationDate
    campaignExpense
    campaignExpenseUrl
    totalDonations
    donations {
      donor
      amount
      receivedAt
      url
    }
  }
`;

export const OROLTSOO_PROFILE_INFO = gql`
  query OroltsooProfileInfo {
    oroltsooProfileInfo {
      ${PROFILE_FIELDS}
    }
  }
`;

export const OROLTSOO_PROFILE_FIELDS = PROFILE_FIELDS;
