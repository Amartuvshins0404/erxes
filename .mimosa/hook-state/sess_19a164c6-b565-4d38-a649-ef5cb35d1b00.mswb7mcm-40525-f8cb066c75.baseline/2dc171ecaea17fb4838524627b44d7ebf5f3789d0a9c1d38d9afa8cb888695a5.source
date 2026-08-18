import { gql } from '@apollo/client';

export const CREATE_PROJECT = gql`
  mutation BlockCreateProject($name: String!) {
    blockCreateProject(name: $name) {
      _id
    }
  }
`;

export const BLOCK_PUBLISH_PROJECT = gql`
  mutation BlockPublishProject($id: String!, $isPublished: Boolean!) {
    blockPublishProject(_id: $id, isPublished: $isPublished) {
      _id
    }
  }
`;

export const BLOCK_REMOVE_PROJECT = gql`
  mutation BlockRemoveProject($id: String!) {
    blockRemoveProject(_id: $id) {
      _id
    }
  }
`;

export const UPDATE_PROJECT_GENERAL_INFO = gql`
  mutation BlockAdminUpdateProject(
    $_id: String!
    $input: BlockAdminProjectInput!
  ) {
    blockAdminUpdateProject(_id: $_id, input: $input) {
      _id
    }
  }
`;

export const BLOCK_ADD_PROJECT_MEMBERS = gql`
  mutation BlockAddProjectMembers($project: String!, $memberIds: [String!]!) {
    blockAddProjectMembers(project: $project, memberIds: $memberIds) {
      _id
    }
  }
`;

export const BLOCK_UPDATE_PROJECT_MEMBER = gql`
  mutation BlockUpdateProjectMember(
    $id: String!
    $role: BlockProjectMemberRole
  ) {
    blockUpdateProjectMember(_id: $id, role: $role) {
      _id
    }
  }
`;

export const BLOCK_DELETE_PROJECT_MEMBER = gql`
  mutation BlockDeleteProjectMember($id: String!) {
    blockDeleteProjectMember(_id: $id) {
      _id
    }
  }
`;
