import { GQL_OFFSET_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type CpBlockAdminAgency {
    _id: String
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
    logo: String
    coverImage: String
    socialLinks: JSON
    operationArea: BlockAdminAgencyOperationArea
    fieldsOfExpertise: BlockAdminAgencyFieldOfExpertise
    messengerIntegrationId: String
    widgetBundleUrl: String
    verificationStatus: String
    createdAt: Date
    updatedAt: Date
  }

  type CpBlockAdminAgentUser {
    _id: String
    firstName: String
    lastName: String
    avatar: String
    email: String
  }

  type CpBlockAdminAgent {
    _id: String
    agencyId: String
    role: String
    description: String
    country: String
    city: String
    district: String
    facebookUrl: String
    instagramUrl: String
    linkedUrl: String
    certificatePhotos: [Attachment]
    user: CpBlockAdminAgentUser
    createdAt: Date
    updatedAt: Date
  }
`;

const queryParams = `
  verificationStatus: String
  searchValue: String
  city: String
  district: String

  ${GQL_OFFSET_PARAM_DEFS}
`;

const agentQueryParams = `
  agencyId: String
  role: String
  searchValue: String

  ${GQL_OFFSET_PARAM_DEFS}
`;

export const queries = `
  cpGetBlockAdminAgencies(${queryParams}): [CpBlockAdminAgency]
  cpGetBlockAdminAgencyInfo(_id: String!): CpBlockAdminAgency
  cpBlockAdminAgents(${agentQueryParams}): [CpBlockAdminAgent]
  cpBlockAdminAgentInfo(_id: String!): CpBlockAdminAgent
`;
