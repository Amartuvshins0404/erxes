import { gql } from '@apollo/client';

export const ONE_FIT_MEMBERSHIP_PURCHASE_REPORT = gql`
  query OneFitMembershipPurchaseReportPage(
    $startDate: Date!
    $endDate: Date!
    $interval: OneFitMembershipPurchaseReportInterval!
  ) {
    oneFitMembershipPurchaseReport(
      startDate: $startDate
      endDate: $endDate
      interval: $interval
    ) {
      periodKey
      purchaseCount
    }
    oneFitMembershipPurchasePlanShares(
      startDate: $startDate
      endDate: $endDate
    ) {
      planId
      planName
      purchaseCount
      percent
    }
  }
`;
