import { gql } from '@apollo/client';

export const ONE_FIT_PROVIDER_CREATE = gql`
  mutation OneFitProviderCreate(
    $businessName: OneFitMultilingualStringInput!
    $description: OneFitMultilingualStringOptionalInput
    $location: OneFitLocationInput!
    $contactInfo: OneFitContactInfoInput!
    $facilities: [String]
    $categoryIds: [String]!
    $singleProviderLimit: Int
    $isActive: Boolean
    $icon: String
    $coverImages: [String]
  ) {
    oneFitProviderCreate(
      businessName: $businessName
      description: $description
      location: $location
      contactInfo: $contactInfo
      facilities: $facilities
      categoryIds: $categoryIds
      singleProviderLimit: $singleProviderLimit
      isActive: $isActive
      icon: $icon
      coverImages: $coverImages
    ) {
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
      location {
        address {
          en
          mn
        }
        city {
          en
          mn
        }
        district {
          en
          mn
        }
        coordinates {
          lat
          lng
        }
      }
      contactInfo {
        phone
        email
        website
      }
      facilities
      categoryIds
      singleProviderLimit
      status
      isActive
      icon
      coverImages
    }
  }
`;

export const ONE_FIT_PROVIDER_UPDATE = gql`
  mutation OneFitProviderUpdate(
    $_id: String!
    $businessName: OneFitMultilingualStringInput
    $description: OneFitMultilingualStringOptionalInput
    $location: OneFitLocationInput
    $contactInfo: OneFitContactInfoInput!
    $facilities: [String]
    $categoryIds: [String]!
    $singleProviderLimit: Int
    $isActive: Boolean
    $icon: String
    $coverImages: [String]
  ) {
    oneFitProviderUpdate(
      _id: $_id
      businessName: $businessName
      description: $description
      location: $location
      contactInfo: $contactInfo
      facilities: $facilities
      categoryIds: $categoryIds
      singleProviderLimit: $singleProviderLimit
      isActive: $isActive
      icon: $icon
      coverImages: $coverImages
    ) {
      _id
      modifiedAt
      businessName {
        en
        mn
      }
      description {
        en
        mn
      }
      location {
        address {
          en
          mn
        }
        city {
          en
          mn
        }
        district {
          en
          mn
        }
        coordinates {
          lat
          lng
        }
      }
      contactInfo {
        phone
        email
        website
      }
      facilities
      categoryIds
      singleProviderLimit
      status
      isActive
      icon
      coverImages
    }
  }
`;

export const ONE_FIT_PROVIDER_APPROVE = gql`
  mutation OneFitProviderApprove($_id: String!, $approvedBy: String!) {
    oneFitProviderApprove(_id: $_id, approvedBy: $approvedBy) {
      _id
      status
      approvedAt
      approvedBy
    }
  }
`;

export const ONE_FIT_PROVIDER_REJECT = gql`
  mutation OneFitProviderReject(
    $_id: String!
    $rejectionReason: String!
    $rejectedBy: String!
  ) {
    oneFitProviderReject(
      _id: $_id
      rejectionReason: $rejectionReason
      rejectedBy: $rejectedBy
    ) {
      _id
      status
      rejectionReason
      rejectedBy
    }
  }
`;

export const ONE_FIT_PROVIDERS_REMOVE = gql`
  mutation OneFitProvidersRemove($ids: [String]!) {
    oneFitProvidersRemove(ids: $ids)
  }
`;
