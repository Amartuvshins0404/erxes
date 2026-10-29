export const types = `
  type AgentsModelThinking {
    kind: String
    levels: [String]
  }

  type AgentsModelInfo {
    id: String
    family: String
    recommended: Boolean
    name: String
    thinking: AgentsModelThinking
  }

  type AgentsModelVerification {
    provider: String
    model: String
    ok: Boolean
    error: String
  }

  type AgentsProviderModels {
    connectionId: String!
    connectionName: String!
    provider: String!
    scope: String!
    isDefault: Boolean!
    models: [String]
    catalog: [AgentsModelInfo]
    error: String
  }
`;

export const queries = `
  agentsModels: [AgentsProviderModels]
`;

export const mutations = `
  agentsModelVerify(connectionId: String!, model: String!): AgentsModelVerification
  agentsSetDefaultConnection(connectionId: String): Boolean
`;
