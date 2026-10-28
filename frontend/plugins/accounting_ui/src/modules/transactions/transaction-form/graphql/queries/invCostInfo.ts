import { gql } from '~/gql';

export const GET_ACC_CURRENT_COST_QUERY = gql(`
query accountingGetAccCurrentCost($productIds: [String!]!, $accountId: String!, $placeEntityId: String, $excludedTransactionIds: [String!]) {
  getAccCurrentCost(
    productIds: $productIds
    accountId: $accountId
    placeEntityId: $placeEntityId
    excludedTransactionIds: $excludedTransactionIds
  ) {
    productId
    unitCost
    remainder
    totalCost
  }
}
`);

export const GET_ACC_LAST_INCOME_PRICE_QUERY = gql(`
query accountingGetAccLastIncomePrice($productIds: [String!]!) {
  getAccLastIncomePrice(productIds: $productIds) {
    productId
    unitPrice
  }
}
`);

export const GET_ACC_BULK_INCOME_PRODUCT_FILL_QUERY = gql(`
query accountingBulkIncomeProductFill($productIds: [String!]!, $limit: Int) {
  getAccLastIncomePrice(productIds: $productIds) {
    productId
    unitPrice
  }
  productsMain(ids: $productIds, limit: $limit) {
    list {
      _id
      weight
    }
  }
}
`);

export const GET_ACCOUNTING_PRODUCT_UNIT_PRICE_QUERY = gql(`
query accountingProductUnitPrice($_id: String) {
  productDetail(_id: $_id) {
    _id
    unitPrice
    weight
  }
}
`);
