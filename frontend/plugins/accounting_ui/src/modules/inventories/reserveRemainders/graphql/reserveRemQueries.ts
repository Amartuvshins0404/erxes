import { gql } from '~/gql';

export const RESERVE_REMS_QUERY = gql(`
query accountingReserveRems($searchValue: String, $placeEntityId: String, $productId: String, $productCategoryId: String, $page: Int, $perPage: Int, $sortField: String, $sortDirection: Int) {
  reserveRems(
    searchValue: $searchValue
    placeEntityId: $placeEntityId
    productId: $productId
    productCategoryId: $productCategoryId
    page: $page
    perPage: $perPage
    sortField: $sortField
    sortDirection: $sortDirection
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
  reserveRemsCount(
    searchValue: $searchValue
    placeEntityId: $placeEntityId
    productId: $productId
    productCategoryId: $productCategoryId
  )
}
`);
