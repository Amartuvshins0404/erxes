import { gql } from '@apollo/client';

export const GET_AGENT = gql`
  query GetAgent($identifierId: String!) {
    getAgent(identifierId: $identifierId) {
      _id
      identifierId
      name
      url
      token
      agentId
      serverId
      createdAt
      updatedAt
      status
      provisioning {
        stage
        message
        startedAt
        updatedAt
        error
      }
    }
  }
`;
