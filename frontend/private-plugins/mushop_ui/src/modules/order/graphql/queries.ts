import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const MUSHOP_ORDERS = gql`
  query MushopOrders(
    $status: String
    $supplierId: String
    $customerId: String
    $entityId: String
    $dateFilters: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mushopOrders(
      status: $status
      supplierId: $supplierId
      customerId: $customerId
      entityId: $entityId
      dateFilters: $dateFilters
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        status
        entityId
        customerId
        error
        createdAt
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
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;
