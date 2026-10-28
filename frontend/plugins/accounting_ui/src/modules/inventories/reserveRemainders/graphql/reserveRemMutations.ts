import { gql } from '~/gql';

export const RESERVE_REMS_ADD = gql(`
mutation accountingReserveRemsAdd($placeEntityIds: [String], $productCategoryId: String, $productId: String, $remainder: Float) {
  reserveRemsAdd(
    placeEntityIds: $placeEntityIds
    productCategoryId: $productCategoryId
    productId: $productId
    remainder: $remainder
  ) {
    _id
    placeEntityId
    productId
    uom
    remainder
    createdAt
    modifiedAt
    product {
      _id
      code
      name
    }
    placeEntity {
      _id
      code
      title
    }
    modifiedUser {
      _id
      details {
        avatar
        fullName
      }
    }
  }
}
`);

export const RESERVE_REM_EDIT = gql(`
mutation accountingReserveRemEdit($_id: String!, $placeEntityId: String, $productId: String, $uom: String, $remainder: Float) {
  reserveRemEdit(
    _id: $_id
    placeEntityId: $placeEntityId
    productId: $productId
    uom: $uom
    remainder: $remainder
  ) {
    _id
    placeEntityId
    productId
    uom
    remainder
    createdAt
    modifiedAt
    product {
      _id
      code
      name
    }
    placeEntity {
      _id
      code
      title
    }
    modifiedUser {
      _id
      details {
        avatar
        fullName
      }
    }
  }
}
`);

export const RESERVE_REMS_REMOVE = gql(`
mutation accountingReserveRemsRemove($_ids: [String!]!) {
  reserveRemsRemove(_ids: $_ids)
}
`);
