import { gql } from '@apollo/client';

export const GET_IDENTIFIERS = gql`
  query GetIdentifiers($kind: String) {
    getIdentifiers(kind: $kind) {
      _id
      name
      slug
      kind
      description
      createdUserId
      memberIds
      createdAt
      updatedAt
      server {
        exists
        hasNamespace
        name
        status
      }
    }
  }
`;

export const GET_IDENTIFIER = gql`
  query GetIdentifier($identifierId: String!) {
    getIdentifier(identifierId: $identifierId) {
      _id
      name
      slug
      kind
      description
      createdUserId
      memberIds
      createdAt
      updatedAt
      server {
        exists
        hasNamespace
        name
        status
      }
    }
  }
`;

export const GET_ASSISTANT_ORGS = GET_IDENTIFIERS;
export const GET_ASSISTANT_ORG = GET_IDENTIFIER;
