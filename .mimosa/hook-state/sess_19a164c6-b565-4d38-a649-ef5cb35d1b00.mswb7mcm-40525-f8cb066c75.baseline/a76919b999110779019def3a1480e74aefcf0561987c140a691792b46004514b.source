import { gql } from '@apollo/client';

export const ONE_FIT_DASHBOARD_STATS = gql`
  query OneFitDashboardStats(
    $startDate: Date!
    $endDate: Date!
    $planId: String
  ) {
    oneFitDashboardStats(
      startDate: $startDate
      endDate: $endDate
      planId: $planId
    ) {
      totalOneFitUsers {
        value
        previousValue
        changePercent
      }
      activeUsersInPeriod {
        value
        previousValue
        changePercent
      }
      newUsersInPeriod {
        value
        previousValue
        changePercent
      }
      b2bOrganizationsActive {
        value
        previousValue
        changePercent
      }
      averageBookingsPerActiveUserInPeriod {
        value
        previousValue
        changePercent
      }
      b2bB2cSales {
        b2bCount
        b2cCount
        b2bPercent
        b2cPercent
      }
      userGrowthByMonth {
        monthKey
        b2bUsers
        b2cUsers
        newUsers
      }
      bookingStatusByDay {
        dayKey
        bookings
        completed
        noShow
      }
      categoryDistribution {
        categoryId
        label
        parentId
        depth
        count
        percent
      }
      packageStats {
        planId
        planName
        activeCustomerCount
        currentCreditTotal
        totalCredit
        consumedCredit
        checkInCount {
          attended
          noShow
          cancelled
        }
        usagePercent
      }
      companyUserStats {
        companyId
        companyName
        userId
        userName
        userPhone
        planId
        planName
        lastPurchaseDate
        planCredit
        creditBeforeLastPurchase
        lastExpirationCredit
        currentCredit
        usedCredit
      }
    }
  }
`;
