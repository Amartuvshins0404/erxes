import { gql } from '~/gql';

export const SAFE_REMAINDER_ADD = gql(`
mutation accountingSafeRemainderAdd($placeEntityId: String, $date: Date, $description: String, $productCategoryId: String, $attachment: AttachmentInput, $filterField: String) {
  safeRemainderAdd(
    placeEntityId: $placeEntityId
    date: $date
    description: $description
    productCategoryId: $productCategoryId
    attachment: $attachment
    filterField: $filterField
  ) {
    _id
    createdAt
    createdBy
    modifiedAt
    modifiedBy
    date
    description
    status
    placeEntityId
    productCategoryId
    placeEntity {
      _id
      code
      title
    }
    productCategory {
      _id
      code
      name
    }
    modifiedUser {
      _id
      details {
        avatar
        fullName
      }
    }
    incomeRule
    incomeTrId
    outRule
    outTrId
    saleRule
    saleTrId
    costIncreaseRule
    costDecreaseRule
    costIncreaseTrId
    costDecreaseTrId
  }
}
`);
