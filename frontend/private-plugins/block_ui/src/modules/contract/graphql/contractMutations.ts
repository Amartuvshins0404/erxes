import { gql } from '@apollo/client';

export const CREATE_CONTRACT = gql`
  mutation BlockCreateContract($input: BlockContractInput!) {
    blockCreateContract(input: $input) {
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
        type
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

export const UPDATE_CONTRACT_STATUS = gql`
  mutation BlockUpdateContractStatus($id: String!, $status: String!) {
    blockUpdateContractStatus(_id: $id, status: $status) {
      _id
      status
    }
  }
`;

export const UPDATE_CONTRACT = gql`
  mutation BlockUpdateContract($id: String!, $input: BlockContractInput!) {
    blockUpdateContract(_id: $id, input: $input) {
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
        type
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
