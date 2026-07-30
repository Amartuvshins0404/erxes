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
        partyId
        partyType
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
        partyId
        partyType
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
