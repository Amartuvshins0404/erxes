import { gql } from '@apollo/client';

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
