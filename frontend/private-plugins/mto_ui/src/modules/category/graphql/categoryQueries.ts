import { gql } from '@apollo/client';

export const MTO_CATEGORIES = gql`
  query MtoCategories(
    $isActive: Boolean
    $parentId: String
    $onlyTopLevel: Boolean
    $level: String
  ) {
    mtoAssociations(
      isActive: $isActive
      parentId: $parentId
      onlyTopLevel: $onlyTopLevel
      level: $level
    ) {
      _id
      name {
        en
        mn
      }
      logo
      level
      parentId
      isActive
      createdAt
      modifiedAt
    }
  }
`;

export const MTO_CATEGORY = gql`
  query MtoCategory($_id: String!) {
    mtoAssociation(_id: $_id) {
      _id
      name {
        en
        mn
      }
      logo
      level
      parentId
      isActive
      createdAt
      modifiedAt
    }
  }
`;
