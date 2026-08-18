import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_CREDIT_TRANSACTIONS = gql`
  query OneFitCreditTransactions(
    $userId: String
    $transactionType: OneFitCreditTransactionType
    $source: OneFitCreditSource
    $bookingId: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitCreditTransactions(
      userId: $userId
      transactionType: $transactionType
      source: $source
      bookingId: $bookingId
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        userId
        user {
          _id
          firstName
          lastName
          primaryEmail
          primaryPhone
        }
        amount
        transactionType
        source
        bookingId
        corporateCreditId
        companyId
        description
        balanceAfter
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const ONE_FIT_CREDIT_TRANSACTIONS_COUNT = gql`
  query OneFitCreditTransactionsCount(
    $userId: String
    $transactionType: OneFitCreditTransactionType
    $source: OneFitCreditSource
    $bookingId: String
  ) {
    oneFitCreditTransactionsCount(
      userId: $userId
      transactionType: $transactionType
      source: $source
      bookingId: $bookingId
    )
  }
`;

export const ONE_FIT_CREDIT_TRANSACTION = gql`
  query OneFitCreditTransaction($_id: String!) {
    oneFitCreditTransaction(_id: $_id) {
      _id
      createdAt
      userId
      user {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
      amount
      transactionType
      source
      bookingId
      corporateCreditId
      companyId
      description
      balanceAfter
    }
  }
`;

export const ONE_FIT_USER_CREDIT_BALANCE = gql`
  query OneFitUserCreditBalance($userId: String!) {
    oneFitUserCreditBalance(userId: $userId) {
      userId
      balance
      individualBalance
      corporateBalance
    }
  }
`;

export const ONE_FIT_USER_CREDIT_TRANSACTIONS = gql`
  query OneFitUserCreditTransactions($userId: String!, $limit: Int) {
    oneFitUserCreditTransactions(userId: $userId, limit: $limit) {
      _id
      createdAt
      userId
      user {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
      amount
      transactionType
      source
      bookingId
      corporateCreditId
      companyId
      description
      balanceAfter
    }
  }
`;
