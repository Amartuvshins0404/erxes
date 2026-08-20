import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BlockAdminAgentUser {
    _id: String
    firstName: String
    lastName: String
    avatar: String
    email: String
  }

  type BlockAdminAgent {
    _id: String
    entityId: String
    subdomain: String
    agencyId: String
    memberId: String
    role: String
    description: String
    country: String
    city: String
    district: String
    facebookUrl: String
    instagramUrl: String
    linkedUrl: String
    certificatePhotos: [Attachment]
    user: BlockAdminAgentUser
    createdAt: Date
    updatedAt: Date
  }

  type BlockAdminAgentListResponse {
    list: [BlockAdminAgent]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const queryParams = `
  agencyId: String
  role: String
  searchValue: String

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  getBlockAdminAgents(${queryParams}): BlockAdminAgentListResponse
  getBlockAdminAgentInfo(_id: String!): BlockAdminAgent
`;
