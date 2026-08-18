import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const MUSHOP_COLLECTIVES = gql`
  query MushopCollectives(
    $searchValue: String
    $status: String
    $targetSubdomain: String
    $supplierId: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mushopCollectives(
      searchValue: $searchValue
      status: $status
      targetSubdomain: $targetSubdomain
      supplierId: $supplierId
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        name
        description
        targetSubdomain
        supplierIds
        status
        totalCreated
        totalFailed
        lastSyncedAt
        createdAt
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

export const MUSHOP_CHECK_SUBDOMAIN = gql`
  query MushopCheckSubdomain($subdomain: String) {
    mushopCheckSubdomain(subdomain: $subdomain)
  }
`;
