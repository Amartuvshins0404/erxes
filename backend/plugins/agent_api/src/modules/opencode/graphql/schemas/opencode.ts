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
    transferredFromSubdomain: String
    transferredAt: Date

    createdAt: Date
    updatedAt: Date
  }

  type OpencodeCredentials {
    username: String
    password: String
  }

  type OpencodeTransferCredentials {
    kind: String
    sourceSubdomain: String
    serverName: String
    serverUrl: String
    gatewayToken: String
    provider: String
    serverId: String
    serverPassword: String
    status: String
  }

  input DeployOpencodeInput {
    provider: String!
    apiKey: String!
  }

  input TransferOpencodeInput {
    serverName: String!
    gatewayToken: String!
    provider: String!
    serverUrl: String!
    serverId: String
    serverPassword: String
    sourceSubdomain: String
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
  transferOpencode(identifierId: String!, input: TransferOpencodeInput!): Opencode
  createOpencodeTransferCredentials(identifierId: String!): OpencodeTransferCredentials
  destroyOpencode(identifierId: String!): Opencode
  fixAndRestartOpencode(identifierId: String!): Boolean
  setOpencodeApiKey(identifierId: String!, input: SetOpencodeApiKeyInput!): Boolean
`;
