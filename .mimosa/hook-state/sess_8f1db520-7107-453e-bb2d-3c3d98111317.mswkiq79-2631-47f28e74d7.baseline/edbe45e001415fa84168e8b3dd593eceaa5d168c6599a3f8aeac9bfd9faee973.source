import { gql } from '@apollo/client';

export const GET_CUSTOMER_SYNC = gql`
  query BlockGetCustomerSync($customerId: String!) {
    blockGetCustomerSync(customerId: $customerId) {
      _id
      customerId
      blockAdminId
      createdAt
      updatedAt
    }
  }
`;
