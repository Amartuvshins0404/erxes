import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_CUSTOMERS = gql`
  query OneFitCustomers(
    $searchValue: String
    $phone: String
    $email: String
    $membershipPlanId: String
    $membershipStatus: OneFitMembershipStatus
    $graceMode: Boolean
    $minCreditBalance: Float
    $maxCreditBalance: Float
    $preferredActivityTypeId: String
    $type: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitCustomers(
      searchValue: $searchValue
      phone: $phone
      email: $email
      membershipPlanId: $membershipPlanId
      membershipStatus: $membershipStatus
      graceMode: $graceMode
      minCreditBalance: $minCreditBalance
      maxCreditBalance: $maxCreditBalance
      preferredActivityTypeId: $preferredActivityTypeId
      type: $type
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        updatedAt
        firstName
        lastName
        primaryEmail
        primaryPhone
        oneFitMembershipPlanId
        oneFitMembershipExpiresAt
        oneFitMembershipStatus
        graceMode
        oneFitIsMembershipOnHold
        oneFitMembershipHoldStartAt
        oneFitMembershipHoldEndAt
        oneFitMembershipHoldEndedAt
        oneFitCurrentCreditBalance
        oneFitTotalCreditsEarned
        oneFitTotalCreditsUsed
        oneFitPreferredActivityTypes
        oneFitBookingPreferences {
          preferredTimeSlots
          preferredDays
          notificationEnabled
        }
        oneFitLastBookingDate
        oneFitTotalBookings
        oneFitPaidNotActivatedPurchasesCount
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

export const ONE_FIT_CUSTOMER = gql`
  query OneFitCustomer($_id: String!) {
    oneFitCustomer(_id: $_id) {
      _id
      createdAt
      updatedAt
      firstName
      lastName
      primaryEmail
      primaryPhone
      oneFitMembershipPlanId
      oneFitMembershipExpiresAt
      oneFitMembershipStatus
      oneFitIsMembershipOnHold
      oneFitMembershipHoldStartAt
      oneFitMembershipHoldEndAt
      oneFitMembershipHoldEndedAt
      oneFitCurrentCreditBalance
      oneFitTotalCreditsEarned
      oneFitTotalCreditsUsed
      oneFitPreferredActivityTypes
      oneFitBookingPreferences {
        preferredTimeSlots
        preferredDays
        notificationEnabled
      }
      oneFitLastBookingDate
      oneFitTotalBookings
      oneFitPaidNotActivatedPurchasesCount
    }
  }
`;

export const ONE_FIT_CUSTOMERS_COUNT = gql`
  query OneFitCustomersCount(
    $phone: String
    $email: String
    $membershipPlanId: String
    $membershipStatus: OneFitMembershipStatus
    $graceMode: Boolean
    $minCreditBalance: Float
    $maxCreditBalance: Float
    $preferredActivityTypeId: String
    $type: String
  ) {
    oneFitCustomersCount(
      phone: $phone
      email: $email
      membershipPlanId: $membershipPlanId
      membershipStatus: $membershipStatus
      graceMode: $graceMode
      minCreditBalance: $minCreditBalance
      maxCreditBalance: $maxCreditBalance
      preferredActivityTypeId: $preferredActivityTypeId
      type: $type
    )
  }
`;
