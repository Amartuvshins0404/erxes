export const types = `
  type MastraAgent {
    _id: String
    accountName: String!
    accountDescription: String
    instructions: String
    provider: String
    model: String
    skills: [String]
    destructiveOps: String
    memoryEnabled: Boolean
    debug: Boolean
    maxSteps: Int
    temperature: Float
    permissionGroupIds: [String!]!
    isActive: Boolean!
    createdAt: Date
    updatedAt: Date
    workflowsCount: Int
  }

  input MastraAgentInput {
    name: String
    description: String
    instructions: String
    provider: String
    model: String
    skills: [String]
    destructiveOps: String
    memoryEnabled: Boolean
    debug: Boolean
    maxSteps: Int
    temperature: Float
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
  mastraAgent(_id: String!): MastraAgent
  mastraAgentChat(agentId: String!, message: String!, threadId: String): String
`;

export const mutations = `
  mastraAgentCreate(doc: MastraAgentInput!): MastraAgent
  mastraAgentUpdate(_id: String!, doc: MastraAgentInput!): MastraAgent
  mastraAgentRemove(_id: String!): JSON
`;
