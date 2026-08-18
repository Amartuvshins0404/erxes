import { gql } from '@apollo/client';

export const ONE_FIT_ACTIVITY_CATEGORY_CREATE = gql`
  mutation OneFitActivityCategoryCreate(
    $name: OneFitMultilingualStringInput!
    $description: OneFitMultilingualStringOptionalInput
    $parentId: String
    $isActive: Boolean
    $icon: String
    $image: String
  ) {
    oneFitActivityCategoryCreate(
      name: $name
      description: $description
      parentId: $parentId
      isActive: $isActive
      icon: $icon
      image: $image
    ) {
      _id
      createdAt
      modifiedAt
      name {
        en
        mn
      }
      description {
        en
        mn
      }
      parentId
      isActive
      icon
      image
    }
  }
`;

export const ONE_FIT_ACTIVITY_CATEGORY_UPDATE = gql`
  mutation OneFitActivityCategoryUpdate(
    $_id: String!
    $name: OneFitMultilingualStringInput!
    $description: OneFitMultilingualStringOptionalInput
    $parentId: String
    $isActive: Boolean
    $icon: String
    $image: String
  ) {
    oneFitActivityCategoryUpdate(
      _id: $_id
      name: $name
      description: $description
      parentId: $parentId
      isActive: $isActive
      icon: $icon
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
      parentId
      isActive
      icon
      image
    }
  }
`;

export const ONE_FIT_ACTIVITY_CATEGORIES_REMOVE = gql`
  mutation OneFitActivityCategoriesRemove($ids: [String]!) {
    oneFitActivityCategoriesRemove(ids: $ids)
  }
`;
