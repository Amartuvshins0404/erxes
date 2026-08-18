import { gql } from '@apollo/client';

export const CREATE_PAYMENT_PLAN = gql`
  mutation BlockCreateProjectPaymentPlan(
    $input: BlockProjectPaymentPlanInput!
  ) {
    blockCreateProjectPaymentPlan(input: $input) {
      _id
    }
  }
`;

export const UPDATE_PAYMENT_PLAN = gql`
  mutation BlockUpdateProjectPaymentPlan(
    $id: String!
    $input: BlockProjectPaymentPlanInput!
  ) {
    blockUpdateProjectPaymentPlan(_id: $id, input: $input) {
      _id
    }
  }
`;

export const REMOVE_PAYMENT_PLAN = gql`
  mutation BlockRemoveProjectPaymentPlan($id: String!) {
    blockRemoveProjectPaymentPlan(_id: $id) {
      _id
    }
  }
`;
