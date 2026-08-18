import { gql } from '@apollo/client';

export const ONE_FIT_ACTIVITY_CATEGORIES = gql`
  query OneFitActivityCategories(
    $searchValue: String
    $name: String
    $parentId: String
    $isActive: Boolean
  ) {
    oneFitActivityCategories(
      searchValue: $searchValue
      name: $name
      parentId: $parentId
      isActive: $isActive
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
      image
      icon
    }
  }
`;

export const ONE_FIT_ACTIVITY_CATEGORIES_COUNT = gql`
  query OneFitActivityCategoriesCount(
    $searchValue: String
    $name: String
    $parentId: String
    $isActive: Boolean
  ) {
    oneFitActivityCategoriesCount(
      searchValue: $searchValue
      name: $name
      parentId: $parentId
      isActive: $isActive
    )
  }
`;

export const ONE_FIT_ACTIVITY_CATEGORY = gql`
  query OneFitActivityCategory($_id: String!) {
    oneFitActivityCategory(_id: $_id) {
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
      image
      icon
    }
  }
`;
