import { gql } from '@apollo/client';

export const MUSHOP_CANCEL_MEMBERSHIP = gql`
  mutation MushopCancelMembership($_id: String!) {
    mushopCancelMembership(_id: $_id) {
      _id
      status
    }
  }
`;

export const MUSHOP_UPDATE_MEMBERSHIP_END_DATE = gql`
  mutation MushopUpdateMembershipEndDate($_id: String!, $endDate: Date!) {
    mushopUpdateMembershipEndDate(_id: $_id, endDate: $endDate) {
      _id
      status
      endDate
    }
  }
`;

export const MUSHOP_UPDATE_MEMBERSHIP_STATUS = gql`
  mutation MushopUpdateMembershipStatus($_id: String!, $status: String!) {
    mushopUpdateMembershipStatus(_id: $_id, status: $status) {
      _id
      status
    }
  }
`;

export const MUSHOP_GRANT_MEMBERSHIP = gql`
  mutation MushopGrantMembership(
    $customerId: String!
    $planId: String!
    $paymentId: String
    $amount: Float
  ) {
    mushopGrantMembership(
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
