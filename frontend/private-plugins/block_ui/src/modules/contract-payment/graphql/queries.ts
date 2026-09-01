import { gql } from '@apollo/client';

export const GET_PROJECT_PAYMENTS = gql`
  query BlockGetProjectPayments(
    $projectId: String!
    $paid: Boolean
    $contractNumber: String
    $customerId: String
    $unitNumber: String
    $limit: Int
    $cursor: String
    $direction: String
  ) {
    blockGetProjectPayments(
      projectId: $projectId
      paid: $paid
      contractNumber: $contractNumber
      customerId: $customerId
      unitNumber: $unitNumber
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        _id
        contractId
        contractNumber
        customerId
        projectId
        unit
        index
        label
        dueDate
        amount
        currency
        status
        paidAmount
        paidDate
        note
        penaltyAmount
        overdueDays
        createdAt
        updatedAt
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_CONTRACT_PAYMENTS = gql`
  query BlockGetContractPayments(
    $contractId: String!
    $limit: Int
    $cursor: String
    $direction: String
  ) {
    blockGetContractPayments(
      contractId: $contractId
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        _id
        contractId
        contractNumber
        customerId
        index
        label
        dueDate
        amount
        currency
        status
        paidAmount
        paidDate
        note
        penaltyAmount
        overdueDays
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_PAYMENT_TRANSACTIONS = gql`
  query BlockGetPaymentTransactions($paymentId: String!) {
    blockGetPaymentTransactions(paymentId: $paymentId) {
      _id
      paymentId
      contractId
      amount
      date
      note
      paymentMethod
      createdBy
      createdAt
    }
  }
`;

export const GET_CONTRACT_PAYMENT_SETTINGS = gql`
  query BlockGetContractPaymentSettings($projectId: String) {
    blockGetContractPaymentSettings(projectId: $projectId) {
      _id
      projectId
      paymentIds
      allowPartial
      updatedAt
    }
  }
`;

// The payment plugin owns the org's configured methods (QPay and friends); the
// settings screen only stores which of them contract payments may use.
export const GET_BLOCK_PAYMENT_METHODS = gql`
  query BlockGetPaymentMethods($status: String) {
    payments(status: $status) {
      _id
      name
      kind
      status
    }
  }
`;
