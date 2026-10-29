export const types = `
  type ConnectionField {
    name: String!
    label: String!
    kind: String!
    secret: Boolean!
    required: Boolean!
    placeholder: String
    options: [String!]
    defaultValue: String
    description: String
  }

  type ConnectionType {
    type: String!
    label: String!
    description: String
    category: String!
    fields: [ConnectionField!]!
    defaultServices: [String!]!
  }

  type Connection {
    _id: String!
    type: String!
    name: String!
    scope: String!
    ownerId: String
    config: JSON
    secretsSet: [String!]!
    secretsUnreadable: [String!]!
    services: [String!]!
    createdBy: String
    updatedBy: String
    createdAt: Date
    updatedAt: Date
  }

  type ConnectionTestResult {
    ok: Boolean!
    error: String
  }

  input ConnectionInput {
    type: String!
    name: String!
    scope: String
    config: JSON
    secrets: JSON
    services: [String!]
  }

  input ConnectionEditInput {
    name: String
    config: JSON
    secrets: JSON
    services: [String!]
  }
`;

export const queries = `
  connectionsTypes(category: String): [ConnectionType!]!
  connections(type: String, category: String, scope: String): [Connection!]!
  connectionsDetail(_id: String!): Connection
  connectionsServices: [String!]!
`;

export const mutations = `
  connectionsAdd(input: ConnectionInput!): Connection
  connectionsEdit(_id: String!, input: ConnectionEditInput!): Connection
  connectionsRemove(_id: String!): Boolean
  connectionsTest(_id: String!): ConnectionTestResult
`;
