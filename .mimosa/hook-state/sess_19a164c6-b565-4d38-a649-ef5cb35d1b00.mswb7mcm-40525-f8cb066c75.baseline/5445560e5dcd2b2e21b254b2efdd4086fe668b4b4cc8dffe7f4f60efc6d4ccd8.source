import { gql } from '@apollo/client';

export const PAYMENTS = gql`
  query payments($status: String, $kind: String) {
    payments(status: $status, kind: $kind) {
      _id
      name
      kind
      status
      config
      createdAt
    }
  }
`;

export const ONE_FIT_SYSTEM_CONFIG_BY_KEY = gql`
  query MtoSystemConfigByKey($key: String!) {
    mtoSystemConfigByKey(key: $key) {
      _id
      createdAt
      modifiedAt
      key
      value
      description
    }
  }
`;
