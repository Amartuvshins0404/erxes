import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const MTO_REGISTRATION_MEMBERSHIP_SUMMARIES = gql`
  query MtoRegistrationMembershipSummaries {
    mtoRegistrationMembershipSummaries {
      membershipTypeId
      title
      schemaVersion
    }
  }
`;

export const CP_MTO_REGISTRATION_MEMBERSHIP_SUMMARIES = gql`
  query CpMtoRegistrationMembershipSummaries {
    cpMtoRegistrationMembershipSummaries {
      membershipTypeId
      title
      schemaVersion
    }
  }
`;

export const MTO_REGISTRATION_FORM_DEFINITION = gql`
  query MtoRegistrationFormDefinition(
    $membershipTypeId: String!
    $version: String
  ) {
    mtoRegistrationFormDefinition(
      membershipTypeId: $membershipTypeId
      version: $version
    )
  }
`;

export const CP_MTO_REGISTRATION_FORM_DEFINITION = gql`
  query CpMtoRegistrationFormDefinition(
    $membershipTypeId: String!
    $version: String
  ) {
    cpMtoRegistrationFormDefinition(
      membershipTypeId: $membershipTypeId
      version: $version
    )
  }
`;

export const MTO_REGISTRATION_APPLICATIONS = gql`
  query MtoRegistrationApplications(
    $membershipTypeId: String
    $status: String
    $cpUserId: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mtoRegistrationApplications(
      membershipTypeId: $membershipTypeId
      status: $status
      cpUserId: $cpUserId
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        modifiedAt
        subdomain
        membershipTypeId
        membershipTypeTitle
        schemaVersion
        status
        instanceId
        cpUserId
        isRead
        paymentStatus
        invoiceId
        membershipFeeAmount
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

export const CP_MTO_REGISTRATION_APPLICATIONS = gql`
  query CpMtoRegistrationApplications(
    $membershipTypeId: String
    $status: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    cpMtoRegistrationApplications(
      membershipTypeId: $membershipTypeId
      status: $status
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        modifiedAt
        subdomain
        membershipTypeId
        membershipTypeTitle
        schemaVersion
        status
        instanceId
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

export const MTO_REGISTRATION_APPLICATIONS_COUNT = gql`
  query MtoRegistrationApplicationsCount(
    $membershipTypeId: String
    $status: String
    $cpUserId: String
  ) {
    mtoRegistrationApplicationsCount(
      membershipTypeId: $membershipTypeId
      status: $status
      cpUserId: $cpUserId
    )
  }
`;

export const CP_MTO_REGISTRATION_APPLICATIONS_COUNT = gql`
  query CpMtoRegistrationApplicationsCount(
    $membershipTypeId: String
    $status: String
  ) {
    cpMtoRegistrationApplicationsCount(
      membershipTypeId: $membershipTypeId
      status: $status
    )
  }
`;

export const MTO_REGISTRATION_APPLICATION = gql`
  query MtoRegistrationApplication($_id: String!) {
    mtoRegistrationApplication(_id: $_id) {
      _id
      createdAt
      modifiedAt
      subdomain
      membershipTypeId
      membershipTypeTitle
      schemaVersion
      status
      answers
      instanceId
      cpUserId
      invoiceId
      paymentStatus
      membershipFeeAmount
      invoice
    }
  }
`;

export const CP_MTO_REGISTRATION_APPLICATION = gql`
  query CpMtoRegistrationApplication($_id: String!) {
    cpMtoRegistrationApplication(_id: $_id) {
      _id
      createdAt
      modifiedAt
      subdomain
      membershipTypeId
      membershipTypeTitle
      schemaVersion
      status
      answers
      instanceId
      cpUserId
    }
  }
`;

export const MTO_REGISTRATION_FORM_SCHEMAS = gql`
  query MtoRegistrationFormSchemas($membershipTypeId: String) {
    mtoRegistrationFormSchemas(membershipTypeId: $membershipTypeId) {
      _id
      createdAt
      modifiedAt
      membershipTypeId
      schemaVersion
      title
      description
      sections
      applicationsCount
    }
  }
`;
