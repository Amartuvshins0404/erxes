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
      amountType
      status
      startDate
      endDate
      isLifeTime
      party {
        type
        id
      }
      paymentPlan {
        type
        downPaymentPercentage
        interestPercentage
        interestType
        advancePaymentPercentage
        discountPercentage
        description
        installment
        frequency
        penaltyPercentage
        vatIncluded
        paymentDates
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
      amountType
      status
      startDate
      endDate
      isLifeTime
      party {
        type
        id
      }
      paymentPlan {
        type
        downPaymentPercentage
        interestPercentage
        interestType
        advancePaymentPercentage
        discountPercentage
        description
        installment
        frequency
        penaltyPercentage
        vatIncluded
        paymentDates
      }
      user
    }
  }
`;
