import { gql } from '@apollo/client';

export const MTO_ASSOCIATION_CREATE = gql`
  mutation MtoAssociationCreate(
    $name: MtoAssociationNameInput!
    $logo: String
    $parentId: String
    $isActive: Boolean
  ) {
    mtoAssociationCreate(
      name: $name
      logo: $logo
      parentId: $parentId
      isActive: $isActive
    ) {
      _id
      name {
        en
        mn
      }
      logo
      parentId
      isActive
      createdAt
    }
  }
`;

export const MTO_ASSOCIATION_UPDATE = gql`
  mutation MtoAssociationUpdate(
    $_id: String!
    $name: MtoAssociationNameInput
    $logo: String
    $parentId: String
    $isActive: Boolean
  ) {
    mtoAssociationUpdate(
      _id: $_id
      name: $name
      logo: $logo
      parentId: $parentId
      isActive: $isActive
    ) {
      _id
      name {
        en
        mn
      }
      logo
      parentId
      isActive
      modifiedAt
    }
  }
`;

export const MTO_ASSOCIATIONS_REMOVE = gql`
  mutation MtoAssociationsRemove($ids: [String]!) {
    mtoAssociationsRemove(ids: $ids)
  }
`;
