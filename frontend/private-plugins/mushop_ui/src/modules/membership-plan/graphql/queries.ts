import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const MUSHOP_MEMBERSHIP_PLANS = gql`
  query MushopMembershipPlans(
    $searchValue: String
    $isActive: Boolean
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mushopMembershipPlans(
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

export const MUSHOP_MEMBERSHIP_PLAN_DETAIL = gql`
  query MushopMembershipPlanDetail($_id: String!) {
    mushopMembershipPlanDetail(_id: $_id) {
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
