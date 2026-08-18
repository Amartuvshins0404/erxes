import { gql } from '@apollo/client';

export const ONE_FIT_ACTIVITY_TYPE_CREATE = gql`
  mutation OneFitActivityTypeCreate(
    $providerId: String!
    $name: OneFitMultilingualStringInput!
    $description: OneFitMultilingualStringOptionalInput
    $creditCost: Float!
    $price: Float
    $duration: Int!
    $genderRestriction: OneFitGenderRestriction!
    $categoryIds: [String]!
    $isActive: Boolean
    $cancellationDeadline: Int
    $singlePersonLimit: Int
    $image: String
  ) {
    oneFitActivityTypeCreate(
      providerId: $providerId
      name: $name
      description: $description
      creditCost: $creditCost
      price: $price
      duration: $duration
      genderRestriction: $genderRestriction
      categoryIds: $categoryIds
      isActive: $isActive
      cancellationDeadline: $cancellationDeadline
      singlePersonLimit: $singlePersonLimit
      image: $image
    ) {
      _id
      createdAt
      modifiedAt
      providerId
      name {
        en
        mn
      }
      description {
        en
        mn
      }
      creditCost
      price
      duration
      genderRestriction
      categoryIds
      isActive
      cancellationDeadline
      singlePersonLimit
      image
    }
  }
`;

export const ONE_FIT_ACTIVITY_TYPE_UPDATE = gql`
  mutation OneFitActivityTypeUpdate(
    $_id: String!
    $name: OneFitMultilingualStringInput
    $description: OneFitMultilingualStringOptionalInput
    $creditCost: Float
    $price: Float
    $duration: Int
    $genderRestriction: OneFitGenderRestriction
    $categoryIds: [String]
    $isActive: Boolean
    $cancellationDeadline: Int
    $singlePersonLimit: Int
    $image: String
  ) {
    oneFitActivityTypeUpdate(
      _id: $_id
      name: $name
      description: $description
      creditCost: $creditCost
      price: $price
      duration: $duration
      genderRestriction: $genderRestriction
      categoryIds: $categoryIds
      isActive: $isActive
      cancellationDeadline: $cancellationDeadline
      singlePersonLimit: $singlePersonLimit
      image: $image
    ) {
      _id
      modifiedAt
      name {
        en
        mn
      }
      description {
        en
        mn
      }
      creditCost
      price
      duration
      genderRestriction
      categoryIds
      isActive
      cancellationDeadline
      singlePersonLimit
      image
    }
  }
`;

export const ONE_FIT_ACTIVITY_TYPES_REMOVE = gql`
  mutation OneFitActivityTypesRemove($ids: [String]!) {
    oneFitActivityTypesRemove(ids: $ids)
  }
`;
