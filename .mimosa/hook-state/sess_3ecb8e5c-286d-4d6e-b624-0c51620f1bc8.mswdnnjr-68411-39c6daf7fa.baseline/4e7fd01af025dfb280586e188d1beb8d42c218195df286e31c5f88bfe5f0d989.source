import { gql } from '@apollo/client';

export const ONE_FIT_CUSTOMER_UPDATE_MEMBERSHIP = gql`
  mutation OneFitCustomerUpdateMembership(
    $_id: String!
    $membershipPlanId: String!
    $expiresAt: Date!
  ) {
    oneFitCustomerUpdateMembership(
      _id: $_id
      membershipPlanId: $membershipPlanId
      expiresAt: $expiresAt
    ) {
      _id
      oneFitMembershipPlanId
      oneFitMembershipExpiresAt
      oneFitMembershipStatus
    }
  }
`;

export const ONE_FIT_CUSTOMER_UPDATE_CREDIT_BALANCE = gql`
  mutation OneFitCustomerUpdateCreditBalance($_id: String!, $balance: Float!) {
    oneFitCustomerUpdateCreditBalance(_id: $_id, balance: $balance) {
      _id
      oneFitCurrentCreditBalance
    }
  }
`;

export const ONE_FIT_CUSTOMER_UPDATE_BOOKING_PREFERENCES = gql`
  mutation OneFitCustomerUpdateBookingPreferences(
    $_id: String!
    $preferences: JSON
  ) {
    oneFitCustomerUpdateBookingPreferences(_id: $_id, preferences: $preferences) {
      _id
      oneFitBookingPreferences {
        preferredTimeSlots
        preferredDays
        notificationEnabled
      }
    }
  }
`;

const HOLD_CUSTOMER_FRAGMENT = `
  _id
  oneFitIsMembershipOnHold
  oneFitMembershipHoldStartAt
  oneFitMembershipHoldEndAt
  oneFitMembershipHoldEndedAt
  oneFitMembershipExpiresAt
  oneFitMembershipStatus
`;

export const ONE_FIT_MEMBERSHIP_HOLD_START = gql`
  mutation OneFitMembershipHoldStart($userId: String!, $holdDays: Int!) {
    oneFitMembershipHoldStart(userId: $userId, holdDays: $holdDays) {
      ${HOLD_CUSTOMER_FRAGMENT}
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_HOLD_CANCEL = gql`
  mutation OneFitMembershipHoldCancel($userId: String!) {
    oneFitMembershipHoldCancel(userId: $userId) {
      ${HOLD_CUSTOMER_FRAGMENT}
    }
  }
`;

