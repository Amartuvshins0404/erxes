import { gql } from '~/gql';

export const ADJUST_DEBT_RATE_ADD = gql(`
mutation AccountingAdjustDebtRateAdd($mainCurrency: String!, $currency: String!, $spotRate: Float!, $date: Date!, $customerType: String, $customerId: String, $description: String, $gainAccountId: String!, $lossAccountId: String!, $placeEntityId: String, $responsibleEntityId: String) {
  adjustDebtRatesAdd(
    mainCurrency: $mainCurrency
    currency: $currency
    spotRate: $spotRate
    date: $date
    customerType: $customerType
    customerId: $customerId
    description: $description
    gainAccountId: $gainAccountId
    lossAccountId: $lossAccountId
    placeEntityId: $placeEntityId
    responsibleEntityId: $responsibleEntityId
  ) {
    _id
    date
    mainCurrency
    currency
    customerType
    customerId
    description
    spotRate
    gainAccountId
    lossAccountId
    transactionId
    status
    beginDate
    successDate
    checkedAt
    error
    warning
    placeEntityId
    responsibleEntityId
    createdBy
    modifiedBy
    createdAt
    updatedAt
  }
}
`);
