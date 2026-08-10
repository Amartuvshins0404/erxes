import { gql } from '@apollo/client';

export const BA_CANCEL_MEMBERSHIP = gql`
  mutation BaCancelMembership($_id: String!) {
    baCancelMembership(_id: $_id) {
      _id
      status
    }
  }
`;

export const BA_UPDATE_MEMBERSHIP_END_DATE = gql`
  mutation BaUpdateMembershipEndDate($_id: String!, $endDate: Date!) {
    baUpdateMembershipEndDate(_id: $_id, endDate: $endDate) {
      _id
      status
      endDate
    }
  }
`;

export const BA_UPDATE_MEMBERSHIP_STATUS = gql`
  mutation BaUpdateMembershipStatus($_id: String!, $status: String!) {
    baUpdateMembershipStatus(_id: $_id, status: $status) {
      _id
      status
    }
  }
`;

export const BA_GRANT_MEMBERSHIP = gql`
  mutation BaGrantMembership(
    $customerId: String!
    $planId: String!
    $paymentId: String
    $amount: Float
  ) {
    baGrantMembership(
      customerId: $customerId
      planId: $planId
      paymentId: $paymentId
      amount: $amount
    ) {
      _id
      customerId
      planId
      status
      startDate
      endDate
      invoiceId
    }
  }
`;

export const BA_MEMBERSHIP_PLAN_CREATE = gql`
  mutation BaMembershipPlanCreate($doc: BaMembershipPlanInput!) {
    baMembershipPlanCreate(doc: $doc) {
      _id
      name
      price
      currency
      durationMonths
      isActive
    }
  }
`;

export const BA_MEMBERSHIP_PLAN_UPDATE = gql`
  mutation BaMembershipPlanUpdate($_id: String!, $doc: BaMembershipPlanInput!) {
    baMembershipPlanUpdate(_id: $_id, doc: $doc) {
      _id
      name
      price
      currency
      durationMonths
      isActive
    }
  }
`;

export const BA_MEMBERSHIP_PLAN_DEACTIVATE = gql`
  mutation BaMembershipPlanDeactivate($_id: String!) {
    baMembershipPlanDeactivate(_id: $_id) {
      _id
      isActive
    }
  }
`;
