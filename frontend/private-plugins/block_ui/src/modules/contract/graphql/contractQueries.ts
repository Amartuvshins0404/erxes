import { gql } from '@apollo/client';

export const GET_CONTRACTS = gql`
  query BlockGetContracts($unit: String) {
    blockGetContracts(unit: $unit) {
      _id
      number
      unit
      currency
      date
      amount
      status


      party {
        type
        id
      }
      paymentPlan {
        downPaymentPercentage
        downPaymentAmount
        barterPercentage
        barterAmount
        interestPercentage
        interestType
        completionPaymentPercentage
        completionPaymentAmount
        discountPercentage
        description
        installment
        frequency
        penaltyPercentage
        vatIncluded
        roundedInstallmentAmount
        installmentAmounts
        paymentDates
        paymentDueDates
        firstPaymentDate
        downPaymentDate
        completionPaymentDate
        completionPaymentDateLabel
      }
      user
    }
  }
`;

export const GET_CONTRACTS_LIST = gql`
  query BlockGetContractsList(
    $filter: BlockContractFilterInput
    $limit: Int
    $cursor: String
    $direction: String
  ) {
    blockGetContractsList(
      filter: $filter
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        _id
        number
        unit
        currency
        date
        amount
          status
  

        party {
          type
          id
        }
        user
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

export const GET_CONTRACT = gql`
  query BlockGetContract($id: String!) {
    blockGetContract(_id: $id) {
      _id
      number
      unit
      currency
      date
      amount
      status


      party {
        type
        id
      }
      paymentPlan {
        downPaymentPercentage
        downPaymentAmount
        barterPercentage
        barterAmount
        interestPercentage
        interestType
        completionPaymentPercentage
        completionPaymentAmount
        discountPercentage
        description
        installment
        frequency
        penaltyPercentage
        vatIncluded
        roundedInstallmentAmount
        installmentAmounts
        paymentDates
        paymentDueDates
        firstPaymentDate
        downPaymentDate
        completionPaymentDate
        completionPaymentDateLabel
      }
      user
    }
  }
`;
