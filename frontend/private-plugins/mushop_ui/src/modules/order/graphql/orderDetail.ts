import { gql } from '@apollo/client';

export const MUSHOP_ORDER_DETAIL = gql`
  query MushopOrderDetail($_id: String!) {
    mushopOrderDetail(_id: $_id) {
      _id
      subdomain
      order
      status
      entityId
      customerId
      error
      createdAt
      updatedAt
      supplier {
        _id
        name
        code
        logo
      }
      customer {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
    }
  }
`;
