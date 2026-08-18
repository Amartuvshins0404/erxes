import { gql } from '@apollo/client';

export const MTO_CATEGORY_CREATE = gql`
  mutation MtoCategoryCreate(
    $name: MtoMultilingualStringInput!
    $logo: String
    $level: String
    $isActive: Boolean
  ) {
    mtoCategoryCreate(
      name: $name
      logo: $logo
      level: $level
      isActive: $isActive
    ) {
      _id
      name {
        en
        mn
      }
      logo
      level
      isActive
      createdAt
    }
  }
`;

export const MTO_CATEGORY_UPDATE = gql`
  mutation MtoCategoryUpdate(
    $_id: String!
    $name: MtoMultilingualStringInput
    $logo: String
    $level: String
    $isActive: Boolean
  ) {
    mtoCategoryUpdate(
      _id: $_id
      name: $name
      logo: $logo
      level: $level
      isActive: $isActive
    ) {
      _id
      name {
        en
        mn
      }
      logo
      level
      isActive
      modifiedAt
    }
  }
`;

export const MTO_CATEGORIES_REMOVE = gql`
  mutation MtoCategoriesRemove($ids: [String]!) {
    mtoCategoriesRemove(ids: $ids)
  }
`;
