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

export const BA_MEMBERSHIPS = gql`
  query BaMemberships(
    $searchValue: String
    $status: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    baMemberships(
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

export const BA_MEMBERSHIP_DETAIL = gql`
  query BaMembershipDetail($_id: String!) {
    baMembershipDetail(_id: $_id) {
      ${MEMBER_FIELDS}
    }
  }
`;

export const BA_MEMBERSHIP_PLANS = gql`
  query BaMembershipPlans(
    $searchValue: String
    $isActive: Boolean
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    baMembershipPlans(
      searchValue: $searchValue
      isActive: $isActive
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        name
        description
        price
        currency
        durationMonths
        isActive
      }
      totalCount
    }
  }
`;

export const BA_MEMBERSHIP_PLAN_DETAIL = gql`
  query BaMembershipPlanDetail($_id: String!) {
    baMembershipPlanDetail(_id: $_id) {
      _id
      name
      description
      price
      currency
      durationMonths
      isActive
      createdAt
      updatedAt
    }
  }
`;
