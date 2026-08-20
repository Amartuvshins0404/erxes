import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BlockAdminAgencyOperationArea {
    city: String
    district: String
  }

  type BlockAdminAgencyFieldOfExpertise {
    propertyTypes: [String]
    services: [String]
    clientTypes: [String]
  }

  enum BlockAdminAgencyRejectionReasonEnum {
    INCOMPLETE_DOCUMENTS
    INVALID_LICENSE
    DUPLICATE_ACCOUNT
    SUSPICIOUS_ACTIVITY
  }

  input BlockAdminAgencyRejectionInput {
    reasons: [BlockAdminAgencyRejectionReasonEnum!]!
    notes: String
  }

  type BlockAdminAgency {
    _id: String
    entityId: String
    name: String
    brandName: String
    type: String
    description: String
    brief: String
    website: String
    emails: [String]
    primaryEmail: String
    phones: [String]
    primaryPhone: String
    dateFounded: String
    logo: Attachment
    coverImage: Attachment
    documents: [Attachment]
    socialLinks: JSON
    operationArea: BlockAdminAgencyOperationArea
    fieldsOfExpertise: BlockAdminAgencyFieldOfExpertise
    messengerIntegrationId: String
    widgetBundleUrl: String
    verificationStatus: String
    rejectionReasons: [String]
    rejectionNotes: String
  }

  type BlockAdminAgencyListResponse {
    list: [BlockAdminAgency]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const queryParams = `
  verificationStatus: String
  searchValue: String
  district: String
  city: String

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  getBlockAdminAgencies(${queryParams}): BlockAdminAgencyListResponse
  getBlockAdminAgencyInfo(_id: String): BlockAdminAgency
`;

export const mutations = `
  updateBlockAdminAgencyVerificationStatus(agencyId: String, status: BlockAdminAgencyVerificationStatusEnum): BlockAdminAgency
  blockAdminAgencyVerify(agencyId: String!): BlockAdminAgency
  blockAdminAgencyReject(agencyId: String!, input: BlockAdminAgencyRejectionInput!): BlockAdminAgency
`;
