import { gql } from '@apollo/client';

export const MTO_CATEGORY_CREATE = gql`
  mutation MtoCategoryCreate(
    $name: MtoAssociationNameInput!
    $logo: String
    $level: String
    $isActive: Boolean
  ) {
    mtoAssociationCreate(
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
    $name: MtoAssociationNameInput
    $logo: String
    $level: String
    $isActive: Boolean
  ) {
    mtoAssociationUpdate(
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
    mtoAssociationsRemove(ids: $ids)
  }
`;
