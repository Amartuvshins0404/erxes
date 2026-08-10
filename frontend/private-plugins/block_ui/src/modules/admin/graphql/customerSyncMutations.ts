import { gql } from '@apollo/client';

export const SYNC_CUSTOMER = gql`
  mutation BlockSyncCustomer($customerId: String!) {
    blockSyncCustomer(customerId: $customerId) {
      _id
      customerId
      blockAdminId
      createdAt
      updatedAt
    }
  }
`;
