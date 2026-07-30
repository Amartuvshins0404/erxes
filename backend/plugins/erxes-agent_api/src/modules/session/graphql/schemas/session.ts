export const types = `
  type MastraThread {
    _id: String
    threadId: String
    agentId: String
    title: String
    messageCount: Int
    lastMessageAt: Date
    createdAt: Date
    updatedAt: Date
  }

  type MastraMessage {
    _id: String
    threadId: String
    role: String
    content: String
    parts: JSON
    meta: JSON
    attachments: JSON
    createdAt: Date
  }
`;

export const queries = `
  mastraThreads(agentId: String!): [MastraThread]
  mastraThreadMessages(threadId: String!): [MastraMessage]
  mastraThreadArtifacts(threadId: String!): [JSON]
`;

export const mutations = `
  mastraThreadRename(threadId: String!, title: String!): MastraThread
  mastraThreadRemove(threadId: String!): JSON
`;
