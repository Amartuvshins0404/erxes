import { gql } from '@apollo/client';

// Full skill selection, resolved with its active (published) or latest (draft)
// version — used by the editor and the row detail.
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

export const MASTRA_SKILLS = gql`
  query MastraSkills(
    $scope: String
    $status: String
    $searchValue: String
    $page: Int
    $perPage: Int
  ) {
    mastraSkills(
      scope: $scope
      status: $status
      searchValue: $searchValue
      page: $page
      perPage: $perPage
    ) {
      list {
        _id
        name
        description
        status
        visibility
        userInvocable
        category
        isMine
        activeVersionId
        versionCount
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const MASTRA_SKILL = gql`
  query MastraSkill($_id: String!) {
    mastraSkill(_id: $_id) {
      ${SKILL_FIELDS}
    }
  }
`;

export const MASTRA_SKILL_VERSIONS = gql`
  query MastraSkillVersions($skillId: String!, $page: Int, $perPage: Int) {
    mastraSkillVersions(skillId: $skillId, page: $page, perPage: $perPage) {
      _id
      skillId
      versionNumber
      name
      description
      userInvocable
      changeMessage
      changedFields
      createdAt
    }
  }
`;

export const MASTRA_SKILL_VERSION = gql`
  query MastraSkillVersion($_id: String!) {
    mastraSkillVersion(_id: $_id) {
      _id
      skillId
      versionNumber
      name
      description
      instructions
      userInvocable
      metadata
      changeMessage
      changedFields
      createdAt
    }
  }
`;

export const MASTRA_INVOCABLE_SKILLS = gql`
  query MastraInvocableSkills($agentId: String!) {
    mastraInvocableSkills(agentId: $agentId) {
      name
      description
      scope
    }
  }
`;
