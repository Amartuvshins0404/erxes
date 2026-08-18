import { gql } from '@apollo/client';

export const GET_OFFERS = gql`
  query BlockGetOffers($unit: String) {
    blockGetOffers(unit: $unit) {
      _id
      amount
      amountType
      currency
      date
      endDate
      number
      party {
        id
        type
      }
      paymentPlan {
        type
        downPaymentPercentage
        interestPercentage
        advancePaymentPercentage
        discountPercentage
        description
        installment
        frequency
        penaltyPercentage
        vatIncluded
        paymentDates
        firstPaymentDate
        advancePaymentDate
      }
      user
    }
  }
`;

export const GET_OFFER = gql`
  query BlockGetOffers($unit: String, $id: String!) {
    blockGetOffers(unit: $unit) {
      _id
      amount
      amountType
      currency
      date
      endDate
      number
      party {
        id
        type
      }
      paymentPlan {
        type
        downPaymentPercentage
        interestPercentage
        advancePaymentPercentage
        discountPercentage
        description
        installment
        frequency
        penaltyPercentage
        vatIncluded
        paymentDates
        firstPaymentDate
        advancePaymentDate
      }
      user
    }
    blockGetOffer(_id: $id) {
      _id
      amount
      amountType
      currency
      date
      endDate
      number
      party {
        id
        type
      }
      paymentPlan {
        type
        downPaymentPercentage
        interestPercentage
        advancePaymentPercentage
        discountPercentage
        description
        installment
        frequency
        penaltyPercentage
        vatIncluded
        paymentDates
        firstPaymentDate
        advancePaymentDate
      }
      unit
      user
    }
  }
`;
