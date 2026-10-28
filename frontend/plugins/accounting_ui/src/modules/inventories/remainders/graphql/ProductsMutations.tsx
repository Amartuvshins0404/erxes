import { gql } from '~/gql';

export const RE_CALC_REMAINDERS = gql(`
mutation accountingReCalcRemainders($placeEntityId: String, $productCategoryId: String, $productIds: [String]) {
  reCalcRemainders(
    placeEntityId: $placeEntityId
    productCategoryId: $productCategoryId
    productIds: $productIds
  )
}
`);
