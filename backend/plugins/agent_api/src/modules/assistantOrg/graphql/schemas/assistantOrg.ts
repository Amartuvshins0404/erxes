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
  }

  type AgentAssistantLimit {
    limited: Boolean!
    allowed: Boolean!
    limit: Int
    used: Int!
    remaining: Int
    hasActivePlan: Boolean!
    source: String
    upgradeUrl: String
    billingWarning: AgentAssistantBillingWarning
    billingOverview: AgentAssistantBillingOverview
  }

  type AgentAssistantBillingWarning {
    active: Boolean!
    deletionDue: Boolean!
    gracePeriodDays: Int!
    daysUntilDeletion: Int!
    unpaidSince: String
    deletionDate: String
    message: String!
  }

  type AgentAssistantBillingOverview {
    active: Boolean!
    blocked: Boolean!
    overdueCount: Int!
    billingUrl: String
    message: String!
    items: [AgentAssistantBillingItem!]!
  }

  type AgentAssistantBillingItem {
    identifierId: String!
    name: String!
    slug: String!
    description: String
    memberIds: [String!]!
    createdAt: String
    updatedAt: String
    planStartDate: String
    planEndDate: String
    paymentStatus: String!
    blocked: Boolean!
    planActive: Boolean!
    overdueDays: Int!
    message: String!
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
  agentAssistantLimit: AgentAssistantLimit
`;

export const mutations = `
  createIdentifier(input: CreateIdentifierInput!): Identifier
  updateIdentifier(identifierId: String!, input: UpdateIdentifierInput!): Identifier
  inviteIdentifierMembers(identifierId: String!, input: InviteIdentifierMembersInput!): Identifier
  deleteIdentifier(identifierId: String!): Boolean
  setAssistantPlanSelection(identifierIds: [String!]!): Boolean
`;
