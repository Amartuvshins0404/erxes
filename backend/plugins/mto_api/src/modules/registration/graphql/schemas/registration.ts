import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MtoRegistrationMembershipSummary {
    membershipTypeId: String!
    title: String!
    schemaVersion: String!
  }

  type MtoRegistrationApplication {
    _id: String
    createdAt: Date
    modifiedAt: Date
    subdomain: String
    membershipTypeId: String
    membershipTypeTitle: String
    schemaVersion: String
    status: String
    answers: JSON
    instanceId: String
    cpUserId: String
    isRead: Boolean
    invoiceId: String
    paymentStatus: String
    membershipFeeAmount: Float
    invoice: JSON
  }

  type MtoRegistrationApplicationListResponse {
    list: [MtoRegistrationApplication]
    pageInfo: PageInfo
    totalCount: Int
  }

  type MtoRegistrationFormSchema {
    _id: String
    createdAt: Date
    modifiedAt: Date
    membershipTypeId: String!
    schemaVersion: String!
    title: String!
    description: String
    sections: JSON!
    applicationsCount: Int!
  }
`;

const registrationListParams = `
  membershipTypeId: String,
  status: String,
  cpUserId: String,
`;

export const queries = `
  mtoRegistrationFormDefinition(membershipTypeId: String!, version: String): JSON
  cpMtoRegistrationFormDefinition(membershipTypeId: String!, version: String): JSON
  mtoRegistrationMembershipSummaries: [MtoRegistrationMembershipSummary!]!
  cpMtoRegistrationMembershipSummaries: [MtoRegistrationMembershipSummary!]!
  mtoRegistrationApplications(${registrationListParams} ${GQL_CURSOR_PARAM_DEFS}): MtoRegistrationApplicationListResponse
  cpMtoRegistrationApplications(membershipTypeId: String, status: String, ${GQL_CURSOR_PARAM_DEFS}): MtoRegistrationApplicationListResponse
  mtoRegistrationApplicationsCount(${registrationListParams}): Int
  cpMtoRegistrationApplicationsCount(membershipTypeId: String, status: String): Int
  mtoRegistrationApplication(_id: String!): MtoRegistrationApplication
  cpMtoRegistrationApplication(_id: String!): MtoRegistrationApplication
  mtoRegistrationFormSchemas(membershipTypeId: String): [MtoRegistrationFormSchema!]!
  mtoRegistrationFormSchema(membershipTypeId: String!, schemaVersion: String!): MtoRegistrationFormSchema
`;

export const mutations = `
  mtoRegistrationSubmit(
    membershipTypeId: String!
    schemaVersion: String!
    answers: JSON!
    cpUserId: String
  ): MtoRegistrationApplication
  cpMtoRegistrationSubmit(
    membershipTypeId: String!
    schemaVersion: String!
    answers: JSON!
  ): MtoRegistrationApplication
  mtoRegistrationApplicationUpdate(
    _id: String!
    answers: JSON
    status: String
    cpUserId: String
  ): MtoRegistrationApplication
  mtoRegistrationApplicationMarkRead(
    _id: String!
    isRead: Boolean
  ): MtoRegistrationApplication
  cpMtoRegistrationApplicationUpdate(
    _id: String!
    answers: JSON
    status: String
  ): MtoRegistrationApplication
  mtoRegistrationFormSchemaCreate(
    definition: JSON!
  ): MtoRegistrationFormSchema
  mtoRegistrationFormSchemaUpdate(
    _id: String!
    definition: JSON!
  ): MtoRegistrationFormSchema
  mtoRegistrationFormSchemaRemove(
    _id: String!
  ): JSON
  mtoRegistrationApplicationVerifyManualPayment(
    _id: String!
  ): MtoRegistrationApplication
  mtoRegistrationApplicationPaymentUrl(
    _id: String!
  ): String
`;
