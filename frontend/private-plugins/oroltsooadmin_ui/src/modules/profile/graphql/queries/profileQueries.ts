import { gql } from '@apollo/client';

const ADMIN_PROFILE_LIST_FIELDS = `
  _id
  subdomain
  entityId
  firstName
  lastName
  fullName
  avatar
  position
  party
  organization
  district
  territory
  mandateType
  termStart
  termEnd
  status
  promiseProgress
  reviewStatus
  syncedAt
`;

const ADMIN_PROFILE_DETAIL_FIELDS = `
  ${ADMIN_PROFILE_LIST_FIELDS}
  coverImage
  reviewNote
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

export const OROLTSOO_ADMIN_PROFILES = gql`
  query OroltsooAdminProfiles(
    $searchValue: String
    $subdomain: String
    $reviewStatus: String
    $syncedFrom: Date
    $syncedTo: Date
    $limit: Int
    $cursor: String
    $direction: CURSOR_DIRECTION
  ) {
    oroltsooAdminProfiles(
      searchValue: $searchValue
      subdomain: $subdomain
      reviewStatus: $reviewStatus
      syncedFrom: $syncedFrom
      syncedTo: $syncedTo
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        ${ADMIN_PROFILE_LIST_FIELDS}
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const OROLTSOO_ADMIN_PROFILE_DETAIL = gql`
  query OroltsooAdminProfileDetail($id: String!) {
    oroltsooAdminProfileDetail(_id: $id) {
      ${ADMIN_PROFILE_DETAIL_FIELDS}
    }
  }
`;

export const OROLTSOO_ADMIN_PROFILE_REVIEW_FIELDS = `
  _id
  reviewStatus
  reviewNote
`;
