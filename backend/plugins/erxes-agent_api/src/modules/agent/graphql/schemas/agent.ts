export const types = `
  type MastraAgent {
    _id: String
    name: String
    agentId: String
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
    isEnabled: Boolean
    grantGroupId: String
    isOwnAgent: Boolean
    visibility: String
    teamId: String
    departmentId: String
    unitId: String
    createdAt: Date
    updatedAt: Date
    workflowsCount: Int
    capabilities: MastraAgentCapabilities
  }

  type MastraAgentCapabilities {
    canReadConfig: Boolean!
    canChat: Boolean!
    canEdit: Boolean!
    canRemove: Boolean!
    canShare: Boolean!
    canTransferOwnership: Boolean!
    canManageGrant: Boolean!
    canReadWorkflows: Boolean!
    canReadSkills: Boolean!
    canReadLearnings: Boolean!
  }

  input MastraAgentCreateInput {
    name: String
    agentId: String
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
    isEnabled: Boolean
    visibility: String
    teamId: String
    departmentId: String
    unitId: String
  }

  input MastraAgentConfigInput {
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
    isEnabled: Boolean
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
  mastraAgentCreate(doc: MastraAgentCreateInput!): MastraAgent
  mastraAgentUpdate(_id: String!, doc: MastraAgentConfigInput!): MastraAgent
  mastraAgentSetAudience(
    _id: String!
    visibility: String!
    teamId: String
    departmentId: String
    unitId: String
  ): MastraAgent
  mastraAgentTransferOwnership(_id: String!, newOwnerUserId: String!): MastraAgent
  mastraAgentSetGrant(_id: String!, grantGroupId: String): MastraAgent
  mastraAgentRemove(_id: String!): JSON
`;
