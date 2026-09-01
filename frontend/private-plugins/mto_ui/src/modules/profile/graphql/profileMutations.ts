import { gql } from '@apollo/client';
import { MTO_PROFILE_FIELDS } from '@/profile/graphql/profileQueries';

export const MTO_PROFILE_CREATE = gql`
  mutation MtoProfileCreate(
    $businessName: MtoMultilingualStringInput
    $description: MtoMultilingualStringOptionalInput
    $contactInfo: MtoContactInfoInput
    $isActive: Boolean
    $icon: String
    $coverImages: [String]
  ) {
    mtoProfileCreate(
      businessName: $businessName
      description: $description
      contactInfo: $contactInfo
      isActive: $isActive
      icon: $icon
      coverImages: $coverImages
    ) {
      ...MtoProfileFields
    }
  }
  ${MTO_PROFILE_FIELDS}
`;

export const MTO_PROFILE_UPDATE = gql`
  mutation MtoProfileUpdate(
    $_id: String!
    $businessName: MtoMultilingualStringInput
    $description: MtoMultilingualStringOptionalInput
    $contactInfo: MtoContactInfoInput
    $isActive: Boolean
    $icon: String
    $coverImages: [String]
  ) {
    mtoProfileUpdate(
      _id: $_id
      businessName: $businessName
      description: $description
      contactInfo: $contactInfo
      isActive: $isActive
      icon: $icon
      coverImages: $coverImages
    ) {
      ...MtoProfileFields
    }
  }
  ${MTO_PROFILE_FIELDS}
`;

export const MTO_PROFILE_APPROVE = gql`
  mutation MtoProfileApprove($_id: String!, $approvedBy: String!) {
    mtoProfileApprove(_id: $_id, approvedBy: $approvedBy) {
      ...MtoProfileFields
    }
  }
  ${MTO_PROFILE_FIELDS}
`;

export const MTO_PROFILE_REJECT = gql`
  mutation MtoProfileReject(
    $_id: String!
    $rejectionReason: String!
    $rejectedBy: String!
  ) {
    mtoProfileReject(
      _id: $_id
      rejectionReason: $rejectionReason
      rejectedBy: $rejectedBy
    ) {
      ...MtoProfileFields
    }
  }
  ${MTO_PROFILE_FIELDS}
`;

export const MTO_PROFILES_REMOVE = gql`
  mutation MtoProfilesRemove($ids: [String]!) {
    mtoProfilesRemove(ids: $ids)
  }
`;
