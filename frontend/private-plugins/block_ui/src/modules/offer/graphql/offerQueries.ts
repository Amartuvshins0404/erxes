import { gql } from '@apollo/client';

export const GET_OFFERS_LIST = gql`
  query BlockGetOffersList(
    $filter: BlockOfferFilterInput
    $limit: Int
    $cursor: String
    $direction: String
  ) {
    blockGetOffersList(
      filter: $filter
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        _id
        amount

        currency
        date
        endDate
        number
        party {
          id
          type
        }
        status
        unit
        user
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_OFFERS = gql`
  query BlockGetOffers($unit: String) {
    blockGetOffers(unit: $unit) {
      _id
      amount

      currency
      date
      endDate
      number
      party {
        id
        type
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
      status
      user
    }
  }
`;

export const GET_OFFER = gql`
  query BlockGetOffer($id: String!) {
    blockGetOffer(_id: $id) {
      _id
      amount
      currency
      date
      endDate
      number
      party {
        id
        type
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
      status
      unit
      user
    }
  }
`;
