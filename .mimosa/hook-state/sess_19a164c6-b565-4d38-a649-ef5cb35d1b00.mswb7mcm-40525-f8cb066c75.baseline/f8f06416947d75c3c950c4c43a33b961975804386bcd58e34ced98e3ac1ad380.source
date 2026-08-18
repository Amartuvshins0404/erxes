import { gql } from '@apollo/client';

export const ONE_FIT_ACCOUNT_STATEMENT = gql`
  query OneFitAccountStatement(
    $providerId: String
    $startDate: Date!
    $endDate: Date!
  ) {
    oneFitAccountStatement(
      providerId: $providerId
      startDate: $startDate
      endDate: $endDate
    ) {
      rows {
        year
        month
        providerId
        provider {
          _id
          businessName {
            en
            mn
          }
        }
        creditsEarnedCompleted
        creditsEarnedNoShow
        bookingCountCompleted
        bookingCountNoShow
        amountEarnedCompleted
        amountEarnedNoShow
      }
      totalCreditsEarned
      totalAmountEarned
    }
  }
`;
