import { gql } from '@apollo/client';

export const MARK_PAYMENT_PAID = gql`
  mutation BlockMarkContractPaymentPaid(
    $id: String!
    $paidAmount: Float
    $paidDate: Date
    $note: String
  ) {
    blockMarkContractPaymentPaid(
      _id: $id
      paidAmount: $paidAmount
      paidDate: $paidDate
      note: $note
    ) {
      _id
      paid
      paidAmount
      paidDate
      note
    }
  }
`;

export const MARK_PAYMENT_UNPAID = gql`
  mutation BlockMarkContractPaymentUnpaid($id: String!) {
    blockMarkContractPaymentUnpaid(_id: $id) {
      _id
      paid
      paidAmount
      paidDate
    }
  }
`;
