import { gql } from '@apollo/client';

export const MTO_REGISTRATION_SUBMIT = gql`
  mutation MtoRegistrationSubmit(
    $membershipTypeId: String!
    $schemaVersion: String!
    $answers: JSON!
    $cpUserId: String
  ) {
    mtoRegistrationSubmit(
      membershipTypeId: $membershipTypeId
      schemaVersion: $schemaVersion
      answers: $answers
      cpUserId: $cpUserId
    ) {
      _id
      status
      membershipTypeId
      schemaVersion
      createdAt
      cpUserId
    }
  }
`;

export const CP_MTO_REGISTRATION_SUBMIT = gql`
  mutation CpMtoRegistrationSubmit(
    $membershipTypeId: String!
    $schemaVersion: String!
    $answers: JSON!
  ) {
    cpMtoRegistrationSubmit(
      membershipTypeId: $membershipTypeId
      schemaVersion: $schemaVersion
      answers: $answers
    ) {
      _id
      status
      membershipTypeId
      schemaVersion
      createdAt
      cpUserId
    }
  }
`;

export const MTO_REGISTRATION_APPLICATION_UPDATE = gql`
  mutation MtoRegistrationApplicationUpdate(
    $_id: String!
    $answers: JSON
    $status: String
    $cpUserId: String
  ) {
    mtoRegistrationApplicationUpdate(
      _id: $_id
      answers: $answers
      status: $status
      cpUserId: $cpUserId
    ) {
      _id
      status
      membershipTypeId
      membershipTypeTitle
      schemaVersion
      answers
      modifiedAt
      cpUserId
      invoiceId
      paymentStatus
      membershipFeeAmount
      invoice
    }
  }
`;

export const CP_MTO_REGISTRATION_APPLICATION_UPDATE = gql`
  mutation CpMtoRegistrationApplicationUpdate(
    $_id: String!
    $answers: JSON
    $status: String
  ) {
    cpMtoRegistrationApplicationUpdate(
      _id: $_id
      answers: $answers
      status: $status
    ) {
      _id
      status
      membershipTypeId
      membershipTypeTitle
      schemaVersion
      answers
      modifiedAt
      cpUserId
    }
  }
`;

export const MTO_REGISTRATION_APPLICATION_MARK_READ = gql`
  mutation MtoRegistrationApplicationMarkRead($_id: String!, $isRead: Boolean) {
    mtoRegistrationApplicationMarkRead(_id: $_id, isRead: $isRead) {
      _id
      isRead
    }
  }
`;

export const MTO_REGISTRATION_FORM_SCHEMA_CREATE = gql`
  mutation MtoRegistrationFormSchemaCreate($definition: JSON!) {
    mtoRegistrationFormSchemaCreate(definition: $definition) {
      _id
      membershipTypeId
      schemaVersion
      title
      description
      sections
      applicationsCount
    }
  }
`;

export const MTO_REGISTRATION_FORM_SCHEMA_UPDATE = gql`
  mutation MtoRegistrationFormSchemaUpdate($_id: String!, $definition: JSON!) {
    mtoRegistrationFormSchemaUpdate(_id: $_id, definition: $definition) {
      _id
      membershipTypeId
      schemaVersion
      title
      description
      sections
      applicationsCount
    }
  }
`;

export const MTO_REGISTRATION_FORM_SCHEMA_REMOVE = gql`
  mutation MtoRegistrationFormSchemaRemove($_id: String!) {
    mtoRegistrationFormSchemaRemove(_id: $_id)
  }
`;

export const MTO_REGISTRATION_APPLICATION_VERIFY_MANUAL_PAYMENT = gql`
  mutation MtoRegistrationApplicationVerifyManualPayment($_id: String!) {
    mtoRegistrationApplicationVerifyManualPayment(_id: $_id) {
      _id
      paymentStatus
      invoiceId
      membershipFeeAmount
    }
  }
`;

export const MTO_REGISTRATION_APPLICATION_PAYMENT_URL = gql`
  mutation MtoRegistrationApplicationPaymentUrl($_id: String!) {
    mtoRegistrationApplicationPaymentUrl(_id: $_id)
  }
`;
