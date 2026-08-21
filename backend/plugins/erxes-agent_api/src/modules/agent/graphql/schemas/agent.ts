export const types = `
  enum MastraAgentVisibility {
    private
    shared
    organization
  }

  type MastraAgent {
    _id: String
    accountName: String!
    accountDescription: String
    createdBy: String
    visibility: MastraAgentVisibility!
    audienceUserIds: [String!]!
    instructions: String
    provider: String
    model: String
    additionalTools: [String!]!
    permissionGroupIds: [String!]!
    isActive: Boolean!
    createdAt: Date
    updatedAt: Date
  }

  input MastraAgentInput {
    name: String
    description: String
    visibility: MastraAgentVisibility
    audienceUserIds: [String!]
    instructions: String
    provider: String
    model: String
    additionalTools: [String!]
    permissionGroupIds: [String!]
    isActive: Boolean
  }

  type MastraAgentListResponse {
    list: [MastraAgent]
    totalCount: Int
    pageInfo: PageInfo
  }

`;

export const queries = `
  mastraAgents: [MastraAgent]
  mastraAgentsMain(page: Int, perPage: Int, searchValue: String): MastraAgentListResponse
  mastraAgentAdditionalTools: [String!]!
  mastraAgent(_id: String!): MastraAgent
  mastraAgentChat(agentId: String!, message: String!, threadId: String): String
`;

export const mutations = `
  mastraAgentCreate(doc: MastraAgentInput!): MastraAgent
  mastraAgentUpdate(_id: String!, doc: MastraAgentInput!): MastraAgent
  mastraAgentRemove(_id: String!): JSON
`;
