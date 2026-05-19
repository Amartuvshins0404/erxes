import { gql } from '@apollo/client';

export const GET_PROJECT_PAYMENTS = gql`
  query BlockGetProjectPayments(
    $projectId: String!
    $paid: Boolean
    $limit: Int
    $cursor: String
    $direction: String
  ) {
    blockGetProjectPayments(
      projectId: $projectId
      paid: $paid
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
        paid
        paidAmount
        paidDate
        note
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
        paid
        paidAmount
        paidDate
        note
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
