export const types = `
  type Identifier {
    _id: String
    name: String
    slug: String
    kind: String
    description: String
    createdUserId: String
    memberIds: [String]
    createdAt: Date
    updatedAt: Date
    server: IdentifierServer
  }

  type IdentifierServer {
    exists: Boolean!
    hasNamespace: Boolean!
    name: String
    status: String
  }

  input CreateIdentifierInput {
    name: String!
    kind: String!
    description: String
  }

  input UpdateIdentifierInput {
    name: String!
    description: String
  }

  input InviteIdentifierMembersInput {
    memberIds: [String!]!
  }
`;

export const queries = `
  getIdentifiers(kind: String): [Identifier]
  getIdentifier(identifierId: String!): Identifier
`;

export const mutations = `
  createIdentifier(input: CreateIdentifierInput!): Identifier
  updateIdentifier(identifierId: String!, input: UpdateIdentifierInput!): Identifier
  inviteIdentifierMembers(identifierId: String!, input: InviteIdentifierMembersInput!): Identifier
  deleteIdentifier(identifierId: String!): Boolean
`;
