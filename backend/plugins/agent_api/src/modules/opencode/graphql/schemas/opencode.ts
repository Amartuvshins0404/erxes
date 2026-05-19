export const types = `
  type Opencode {
    _id: String

    identifierId: String
    name: String
    url: String
    token: String
    provider: String
    serverId: String
    status: String

    createdAt: Date
    updatedAt: Date
  }

  type OpencodeCredentials {
    username: String
    password: String
  }

  input DeployOpencodeInput {
    provider: String!
    apiKey: String!
  }

  input SetOpencodeApiKeyInput {
    provider: String
    apiKey: String!
  }
`;

export const queries = `
  getOpencode(identifierId: String!): Opencode
  getOpencodeCredentials(identifierId: String!): OpencodeCredentials
`;

export const mutations = `
  deployOpencode(identifierId: String!, input: DeployOpencodeInput!): Opencode
  destroyOpencode(identifierId: String!): Opencode
  fixAndRestartOpencode(identifierId: String!): Boolean
  setOpencodeApiKey(identifierId: String!, input: SetOpencodeApiKeyInput!): Boolean
`;
