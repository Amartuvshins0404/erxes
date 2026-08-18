import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_MEMBERSHIP_PLANS = gql`
  query OneFitMembershipPlans(
    $searchValue: String
    $isActive: Boolean
    $planType: OneFitMembershipPlanType
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitMembershipPlans(
      searchValue: $searchValue
      isActive: $isActive
      planType: $planType
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        modifiedAt
        name
        description
        creditAmount
        planType
        duration
        price
        saleOptions {
          quantity
          discountPercent
          finalPrice
        }
        isActive
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_PLANS_COUNT = gql`
  query OneFitMembershipPlansCount(
    $searchValue: String
    $isActive: Boolean
    $planType: OneFitMembershipPlanType
  ) {
    oneFitMembershipPlansCount(
      searchValue: $searchValue
      isActive: $isActive
      planType: $planType
    )
  }
`;

export const ONE_FIT_MEMBERSHIP_PLAN = gql`
  query OneFitMembershipPlan($_id: String!) {
    oneFitMembershipPlan(_id: $_id) {
      _id
      createdAt
      modifiedAt
      name
      description
      creditAmount
      planType
      duration
      price
      saleOptions {
        quantity
        discountPercent
        finalPrice
      }
      isActive
    }
  }
`;

export const ONE_FIT_ACTIVE_MEMBERSHIP_PLANS = gql`
  query OneFitActiveMembershipPlans {
    oneFitActiveMembershipPlans {
      _id
      createdAt
      modifiedAt
      name
      description
      creditAmount
      planType
      duration
      price
      saleOptions {
        quantity
        discountPercent
        finalPrice
      }
      isActive
    }
  }
`;
