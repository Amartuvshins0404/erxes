export const types = `
  type MastraAgent {
    _id: String
    name: String
    agentId: String
    description: String
    instructions: String
    provider: String
    model: String
    toolPolicy: String
    allowedTools: [String]
    skills: [String]
    destructiveOps: String
    memoryEnabled: Boolean
    maxSteps: Int
    temperature: Float
    isEnabled: Boolean
    createdBy: String
    isOwnAgent: Boolean
    visibility: String
    teamId: String
    departmentId: String
    unitId: String
    createdAt: Date
    updatedAt: Date
  }

  input MastraAgentInput {
    name: String
    agentId: String
    description: String
    instructions: String
    provider: String
    model: String
    toolPolicy: String
    allowedTools: [String]
    skills: [String]
    destructiveOps: String
    memoryEnabled: Boolean
    maxSteps: Int
    temperature: Float
    isEnabled: Boolean
    visibility: String
    teamId: String
    departmentId: String
    unitId: String
  }

  type MastraAgentListResponse {
    list: [MastraAgent]
    totalCount: Int
    pageInfo: PageInfo
  }

  type MastraAgentQuotaStatus {
    count: Int!
    quota: Int!
    atQuota: Boolean!
  }
`;

export const queries = `
  mastraAgents: [MastraAgent]
  mastraAgentsMain(page: Int, perPage: Int, searchValue: String): MastraAgentListResponse
  mastraAgent(_id: String!): MastraAgent
  mastraAgentChat(agentId: String!, message: String!, threadId: String): String
  mastraMyAgentQuotaStatus: MastraAgentQuotaStatus
`;

export const mutations = `
  mastraAgentCreate(doc: MastraAgentInput!): MastraAgent
  mastraAgentUpdate(_id: String!, doc: MastraAgentInput!): MastraAgent
  mastraAgentRemove(_id: String!): JSON
`;
