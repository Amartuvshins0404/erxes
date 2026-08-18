import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

const MEMBER_FIELDS = `
  _id
  customerId
  plan {
    _id
    name
    description
    price
    currency
    durationMonths
    isActive
  }
  status
  startDate
  endDate
  amount
  currency
  invoiceId
  customer
  createdAt
  updatedAt
`;

export const MUSHOP_MEMBERSHIPS = gql`
  query MushopMemberships(
    $searchValue: String
    $status: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mushopMemberships(
      searchValue: $searchValue
      status: $status
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        ${MEMBER_FIELDS}
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

export const MUSHOP_MEMBERSHIP_DETAIL = gql`
  query MushopMembershipDetail($_id: String!) {
    mushopMembershipDetail(_id: $_id) {
      ${MEMBER_FIELDS}
    }
  }
`;
