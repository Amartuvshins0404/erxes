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
