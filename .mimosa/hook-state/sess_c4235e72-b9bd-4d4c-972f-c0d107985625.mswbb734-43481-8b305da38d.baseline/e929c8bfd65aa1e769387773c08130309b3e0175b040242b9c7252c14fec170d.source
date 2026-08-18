import { gql } from '@apollo/client';

export const ADD_PAYMENT_TRANSACTION = gql`
  mutation BlockAddPaymentTransaction(
    $paymentId: String!
    $amount: Float!
    $date: Date
    $note: String
    $paymentMethod: String
  ) {
    blockAddPaymentTransaction(
      paymentId: $paymentId
      amount: $amount
      date: $date
      note: $note
      paymentMethod: $paymentMethod
    ) {
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

export const UPDATE_PAYMENT_TRANSACTION = gql`
  mutation BlockUpdatePaymentTransaction(
    $id: String!
    $amount: Float
    $date: Date
    $note: String
    $paymentMethod: String
  ) {
    blockUpdatePaymentTransaction(
      _id: $id
      amount: $amount
      date: $date
      note: $note
      paymentMethod: $paymentMethod
    ) {
      _id
      paymentId
      contractId
      amount
      date
      note
      paymentMethod
    }
  }
`;

export const REMOVE_PAYMENT_TRANSACTION = gql`
  mutation BlockRemovePaymentTransaction($id: String!) {
    blockRemovePaymentTransaction(_id: $id) {
      _id
    }
  }
`;
