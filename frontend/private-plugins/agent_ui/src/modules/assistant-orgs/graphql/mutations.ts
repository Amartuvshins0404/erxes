import { gql } from '@apollo/client';

export const CREATE_IDENTIFIER = gql`
  mutation CreateIdentifier($input: CreateIdentifierInput!) {
    createIdentifier(input: $input) {
      _id
      name
      slug
      kind
      description
      createdUserId
      memberIds
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_IDENTIFIER = gql`
  mutation UpdateIdentifier($identifierId: String!, $input: UpdateIdentifierInput!) {
    updateIdentifier(identifierId: $identifierId, input: $input) {
      _id
      name
      slug
      kind
      description
      createdUserId
      memberIds
      createdAt
      updatedAt
    }
  }
`;

export const INVITE_IDENTIFIER_MEMBERS = gql`
  mutation InviteIdentifierMembers($identifierId: String!, $input: InviteIdentifierMembersInput!) {
    inviteIdentifierMembers(identifierId: $identifierId, input: $input) {
      _id
      name
      slug
      kind
      description
      createdUserId
      memberIds
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_IDENTIFIER = gql`
  mutation DeleteIdentifier($identifierId: String!) {
    deleteIdentifier(identifierId: $identifierId)
  }
`;

export const CREATE_ASSISTANT_ORG = CREATE_IDENTIFIER;
export const UPDATE_ASSISTANT_ORG = UPDATE_IDENTIFIER;
export const INVITE_ASSISTANT_ORG_MEMBERS = INVITE_IDENTIFIER_MEMBERS;
export const DELETE_ASSISTANT_ORG = DELETE_IDENTIFIER;
