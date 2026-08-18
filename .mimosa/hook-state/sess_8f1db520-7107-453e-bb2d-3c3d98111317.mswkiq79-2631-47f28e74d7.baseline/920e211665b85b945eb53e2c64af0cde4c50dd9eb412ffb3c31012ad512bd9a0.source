import { gql } from '@apollo/client';

export const ONE_FIT_CREDIT_TRANSACTIONS_REMOVE = gql`
  mutation OneFitCreditTransactionsRemove($ids: [String]!) {
    oneFitCreditTransactionsRemove(ids: $ids)
  }
`;

export const ONE_FIT_CREDIT_TRANSACTION_CREATE = gql`
  mutation OneFitCreditTransactionCreate(
    $userId: String!
    $amount: Float!
    $transactionType: OneFitCreditTransactionType!
    $source: OneFitCreditSource!
    $bookingId: String
    $corporateCreditId: String
    $companyId: String
    $membershipPlanId: String
    $description: String
  ) {
    oneFitCreditTransactionCreate(
      userId: $userId
      amount: $amount
      transactionType: $transactionType
      source: $source
      bookingId: $bookingId
      corporateCreditId: $corporateCreditId
      companyId: $companyId
      membershipPlanId: $membershipPlanId
      description: $description
    ) {
      _id
      createdAt
      userId
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

export const ONE_FIT_CREDIT_TRANSACTIONS_BULK_CREATE = gql`
  mutation OneFitCreditTransactionsBulkCreate(
    $userIds: [String]!
    $companyId: String!
    $amount: Float!
    $transactionType: OneFitCreditTransactionType!
    $source: OneFitCreditSource!
    $membershipPlanId: String
    $description: String
  ) {
    oneFitCreditTransactionsBulkCreate(
      userIds: $userIds
      companyId: $companyId
      amount: $amount
      transactionType: $transactionType
      source: $source
      membershipPlanId: $membershipPlanId
      description: $description
    ) {
      _id
      createdAt
      userId
      amount
      transactionType
      source
      companyId
      description
      balanceAfter
    }
  }
`;
