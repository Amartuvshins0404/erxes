import { gql } from '@apollo/client';

export const GET_PAYMENT_PLANS_BY_PROJECT = gql`
  query BlockGetProjectPaymentPlans($project: String!) {
    blockGetProjectPaymentPlans(project: $project) {
      _id
      completionPaymentPercentage
      description
      discountPercentage
      downPaymentPercentage
      interestPercentage
      frequency
      installment
      name
      project
      type
    }
  }
`;

export const GET_PAYMENT_PLAN = gql`
  query BlockGetPaymentPlan($id: String!) {
    blockGetPaymentPlan(_id: $id) {
      _id
      downPayment
      installment
      name
      project
    }
  }
`;

export const MAIN_CURRENCY = gql`
  query BlockGetConfig($code: String!) {
    configsGetValue(code: $code)
  }
`;
