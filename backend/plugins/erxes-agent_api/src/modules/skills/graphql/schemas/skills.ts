export const types = `
  type MastraSkill {
    _id: String!
    name: String!
    description: String!
    instructions: String
    status: String!
    visibility: String!
    userInvocable: Boolean!
    category: String
    metadata: JSON
    authorId: String
    isMine: Boolean
    activeVersionId: String
    versionCount: Int
    createdAt: Date
    updatedAt: Date
  }

  type MastraSkillVersion {
    _id: String!
    skillId: String!
    versionNumber: Int!
    name: String
    description: String
    instructions: String
    userInvocable: Boolean
    metadata: JSON
    changeMessage: String
    changedFields: [String]
    createdAt: Date
  }

  type MastraSkillListResponse {
    list: [MastraSkill]
    totalCount: Int
  }

  type MastraInvocableSkill {
    name: String!
    description: String!
    scope: String!
  }

  type MastraSkillActivation {
    name: String!
    instructions: String!
  }

  input MastraSkillCreateInput {
    name: String!
    description: String!
    instructions: String!
    userInvocable: Boolean
    visibility: String
    category: String
    metadata: JSON
  }

  input MastraSkillUpdateInput {
    name: String
    description: String
    instructions: String
    userInvocable: Boolean
    category: String
    metadata: JSON
    changeMessage: String
  }
`;

export const queries = `
  mastraSkills(scope: String, status: String, searchValue: String, page: Int, perPage: Int): MastraSkillListResponse
  mastraSkill(_id: String!): MastraSkill
  mastraSkillVersions(skillId: String!, page: Int, perPage: Int): [MastraSkillVersion]
  mastraSkillVersion(_id: String!): MastraSkillVersion
  mastraInvocableSkills(agentId: String!): [MastraInvocableSkill]
`;

export const mutations = `
  mastraSkillCreate(doc: MastraSkillCreateInput!): MastraSkill
  mastraSkillUpdate(_id: String!, doc: MastraSkillUpdateInput!): MastraSkill
  mastraSkillRemove(_id: String!): JSON
  mastraSkillPublish(_id: String!): MastraSkill
  mastraSkillActivateVersion(_id: String!, versionId: String!): MastraSkill
  mastraSkillPromote(_id: String!): MastraSkill
  mastraSkillDemote(_id: String!): MastraSkill
  mastraSkillFromThread(agentId: String!, threadId: String!, nameHint: String, scopeHint: String): MastraSkill
  mastraSkillActivate(agentId: String!, name: String!): MastraSkillActivation
`;
