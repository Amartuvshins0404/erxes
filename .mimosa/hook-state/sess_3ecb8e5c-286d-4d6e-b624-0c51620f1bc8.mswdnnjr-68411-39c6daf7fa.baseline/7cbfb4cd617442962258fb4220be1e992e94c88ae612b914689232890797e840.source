import { gql } from '@apollo/client';

export const ONE_FIT_SYSTEM_CONFIG_UPDATE_SELECTED_PAYMENTS = gql`
  mutation MtoSystemConfigUpdateSelectedPayments($paymentIds: [String]!) {
    mtoSystemConfigUpdateSelectedPayments(paymentIds: $paymentIds) {
      _id
      createdAt
      modifiedAt
      key
      value
      description
    }
  }
`;

export const ONE_FIT_SYSTEM_CONFIG_UPDATE = gql`
  mutation MtoSystemConfigUpdate($key: String!, $value: JSON!) {
    mtoSystemConfigUpdate(key: $key, value: $value) {
      _id
      key
      value
      description
    }
  }
`;
