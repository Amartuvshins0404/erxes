import { gql } from '@apollo/client';

export const MTO_ASSOCIATIONS = gql`
  query MtoAssociations($isActive: Boolean, $parentId: String) {
    mtoAssociations(isActive: $isActive, parentId: $parentId) {
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

export const MTO_ASSOCIATION = gql`
  query MtoAssociation($_id: String!) {
    mtoAssociation(_id: $_id) {
      _id
      name {
        en
        mn
      }
      logo
      parentId
      isActive
      createdAt
      modifiedAt
    }
  }
`;
