import { gql } from '@apollo/client';

export const ONE_FIT_MEMBERSHIP_PURCHASE_CREATE = gql`
  mutation OneFitMembershipPurchaseCreate(
    $userId: String!
    $planId: String!
    $quantity: Int
    $promoCode: String
    $promoCodeId: String
    $removePreviousCredits: Boolean
  ) {
    oneFitMembershipPurchaseCreate(
      userId: $userId
      planId: $planId
      quantity: $quantity
      promoCode: $promoCode
      promoCodeId: $promoCodeId
      removePreviousCredits: $removePreviousCredits
    ) {
      _id
      createdAt
      modifiedAt
      userId
      user {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
      planId
      status
      purchasedAt
      paidAt
      activatedAt
      expiresAt
      amount
      invoiceId
      promoCodeId
      removePreviousCredits
      plan {
        _id
        name
        creditAmount
        duration
        price
        isActive
      }
      invoice
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_PURCHASES_BULK_CREATE = gql`
  mutation OneFitMembershipPurchasesBulkCreate(
    $userIds: [String]!
    $planId: String!
    $quantity: Int
    $companyId: String
    $promoCode: String
    $promoCodeId: String
    $removePreviousCredits: Boolean
  ) {
    oneFitMembershipPurchasesBulkCreate(
      userIds: $userIds
      planId: $planId
      quantity: $quantity
      companyId: $companyId
      promoCode: $promoCode
      promoCodeId: $promoCodeId
      removePreviousCredits: $removePreviousCredits
    ) {
      _id
      createdAt
      modifiedAt
      userId
      user {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
      planId
      status
      purchasedAt
      paidAt
      activatedAt
      expiresAt
      amount
      invoiceId
      promoCodeId
      removePreviousCredits
      plan {
        _id
        name
        creditAmount
        duration
        price
        isActive
      }
      invoice
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_PURCHASE_ACTIVATE = gql`
  mutation OneFitMembershipPurchaseActivate($_id: String!) {
    oneFitMembershipPurchaseActivate(_id: $_id) {
      _id
      modifiedAt
      status
      paidAt
      activatedAt
      expiresAt
      invoiceId
      user {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
      plan {
        _id
        name
        creditAmount
        duration
        price
      }
      invoice
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_PURCHASE_COMPANY_UPDATE = gql`
  mutation OneFitMembershipPurchaseCompanyUpdate(
    $_id: String!
    $companyId: String
  ) {
    oneFitMembershipPurchaseCompanyUpdate(_id: $_id, companyId: $companyId) {
      _id
      modifiedAt
      companyId
      company {
        _id
        primaryName
      }
    }
  }
`;

export const ONE_FIT_MEMBERSHIP_PURCHASE_REMOVE = gql`
  mutation OneFitMembershipPurchaseRemove($_id: String!) {
    oneFitMembershipPurchaseRemove(_id: $_id)
  }
`;
