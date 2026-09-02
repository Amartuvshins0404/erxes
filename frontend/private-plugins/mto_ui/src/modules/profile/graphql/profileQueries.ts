import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const MTO_PROFILE_FIELDS = gql`
  fragment MtoProfileFields on MtoProfile {
    _id
    createdAt
    modifiedAt
    businessName {
      en
      mn
    }
    description {
      en
      mn
    }
    contactInfo {
      phone
      email
      website
    }
    status
    rejectionReason
    approvedAt
    approvedBy
    rejectedBy
    isActive
    icon
    coverImages
    address
    certificateNo
    instanceId
  }
`;

export const MTO_MY_PROFILE = gql`
  query MtoMyProfile {
    mtoMyProfile {
      ...MtoProfileFields
    }
  }
  ${MTO_PROFILE_FIELDS}
`;

export const MTO_PROFILE = gql`
  query MtoProfile($_id: String!) {
    mtoProfile(_id: $_id) {
      ...MtoProfileFields
    }
  }
  ${MTO_PROFILE_FIELDS}
`;

export const MTO_PROFILES = gql`
  query MtoProfiles(
    $searchValue: String
    $status: String
    $isActive: Boolean
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mtoProfiles(
      searchValue: $searchValue
      status: $status
      isActive: $isActive
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        ...MtoProfileFields
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
  ${MTO_PROFILE_FIELDS}
`;
