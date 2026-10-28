import { gql } from '~/gql';

export const ADJUST_DEBT_RATE_CALCULATE = gql(`
mutation AccountingAdjustDebtRateCalculate($_id: String!) {
  adjustDebtRateCalculate(_id: $_id) {
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
    details {
      _id
      accountId
      accountCode
      accountName
      accountKind
      accountCurrency
      customerType
      customerId
      placeEntityId
      responsibleEntityId
      mainBalance
      currencyBalance
      diff
      transactionId
      createdAt
      updatedAt
    }
  }
}
`);

export const ADJUST_DEBT_RATE_DO_TRANSACTION = gql(`
mutation AccountingAdjustDebtRateDoTransaction($_id: String!) {
  adjustDebtRateDoTransaction(_id: $_id) {
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
    details {
      _id
      accountId
      accountCode
      accountName
      accountKind
      accountCurrency
      customerType
      customerId
      placeEntityId
      responsibleEntityId
      mainBalance
      currencyBalance
      diff
      transactionId
      createdAt
      updatedAt
    }
  }
}
`);
