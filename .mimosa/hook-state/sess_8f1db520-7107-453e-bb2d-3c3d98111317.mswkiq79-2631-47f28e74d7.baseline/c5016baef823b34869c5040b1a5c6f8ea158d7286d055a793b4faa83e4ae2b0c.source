import { gql } from '@apollo/client';

export const GET_OPENCODE = gql`
  query GetOpencode($identifierId: String!) {
    getOpencode(identifierId: $identifierId) {
      _id
      identifierId
      name
      url
      token
      provider
      serverId
      createdAt
      updatedAt
      status
    }
  }
`;
