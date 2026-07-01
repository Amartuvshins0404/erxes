import { gql } from '@apollo/client';

export const PAYMENTS = gql`
  query Payments($status: String, $kind: String) {
    payments(status: $status, kind: $kind) {
      _id
      name
      kind
      status
    }
  }
`;
