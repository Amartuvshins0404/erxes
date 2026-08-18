import { gql } from '@apollo/client';

export const ONE_FIT_MEMBERSHIP_PLAN_CREATE = gql`
  mutation OneFitMembershipPlanCreate(
    $name: String!
    $description: String
    $creditAmount: Float!
    $planType: OneFitMembershipPlanType
    $duration: Int
    $price: Float!
    $saleOptions: [OneFitMembershipSaleOptionInput!]
    $isActive: Boolean
  ) {
    oneFitMembershipPlanCreate(
      name: $name
      description: $description
      creditAmount: $creditAmount
      planType: $planType
      duration: $duration
      price: $price
      saleOptions: $saleOptions
      isActive: $isActive
    ) {
      _id
      createdAt
      modifiedAt
      name
      description
      creditAmount
      planType
      duration
      price
      saleOptions {
        quantity
        discountPercent
        finalPrice
      }
      isActive
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_PLAN_UPDATE = gql`
  mutation OneFitMembershipPlanUpdate(
    $_id: String!
    $name: String
    $description: String
    $creditAmount: Float
    $planType: OneFitMembershipPlanType
    $duration: Int
    $price: Float
    $saleOptions: [OneFitMembershipSaleOptionInput!]
    $isActive: Boolean
  ) {
    oneFitMembershipPlanUpdate(
      _id: $_id
      name: $name
      description: $description
      creditAmount: $creditAmount
      planType: $planType
      duration: $duration
      price: $price
      saleOptions: $saleOptions
      isActive: $isActive
    ) {
      _id
      modifiedAt
      name
      description
      creditAmount
      planType
      duration
      price
      saleOptions {
        quantity
        discountPercent
        finalPrice
      }
      isActive
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_PLANS_REMOVE = gql`
  mutation OneFitMembershipPlansRemove($ids: [String]!) {
    oneFitMembershipPlansRemove(ids: $ids)
  }
`;
