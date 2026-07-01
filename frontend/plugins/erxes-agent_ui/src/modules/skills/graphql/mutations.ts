import { gql } from '@apollo/client';

// Selection returned by the skill write mutations — the resolved skill plus the
// lifecycle fields the panel reads back (status / activeVersionId / counts).
const SKILL_FIELDS = `
  _id
  name
  description
  instructions
  status
  visibility
  userInvocable
  category
  metadata
  authorId
  isMine
  activeVersionId
  versionCount
  createdAt
  updatedAt
`;

export const MASTRA_SKILL_CREATE = gql`
  mutation MastraSkillCreate($doc: MastraSkillCreateInput!) {
    mastraSkillCreate(doc: $doc) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_UPDATE = gql`
  mutation MastraSkillUpdate($_id: String!, $doc: MastraSkillUpdateInput!) {
    mastraSkillUpdate(_id: $_id, doc: $doc) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_REMOVE = gql`
  mutation MastraSkillRemove($_id: String!) {
    mastraSkillRemove(_id: $_id)
  }
`;

export const MASTRA_SKILL_PUBLISH = gql`
  mutation MastraSkillPublish($_id: String!) {
    mastraSkillPublish(_id: $_id) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_ACTIVATE_VERSION = gql`
  mutation MastraSkillActivateVersion($_id: String!, $versionId: String!) {
    mastraSkillActivateVersion(_id: $_id, versionId: $versionId) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_PROMOTE = gql`
  mutation MastraSkillPromote($_id: String!) {
    mastraSkillPromote(_id: $_id) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_DEMOTE = gql`
  mutation MastraSkillDemote($_id: String!) {
    mastraSkillDemote(_id: $_id) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_FROM_THREAD = gql`
  mutation MastraSkillFromThread(
    $agentId: String!
    $threadId: String!
    $nameHint: String
    $scopeHint: String
  ) {
    mastraSkillFromThread(
      agentId: $agentId
      threadId: $threadId
      nameHint: $nameHint
      scopeHint: $scopeHint
    ) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_ACTIVATE = gql`
  mutation MastraSkillActivate($agentId: String!, $name: String!) {
    mastraSkillActivate(agentId: $agentId, name: $name) {
      name
      instructions
    }
  }
`;
