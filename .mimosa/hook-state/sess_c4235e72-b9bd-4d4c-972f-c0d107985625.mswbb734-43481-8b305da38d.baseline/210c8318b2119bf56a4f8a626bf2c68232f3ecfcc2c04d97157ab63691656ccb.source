import { gql } from '@apollo/client';

export const GET_AGENT_DETAILS = gql`
  query GetAgentDetails($identifierId: String!, $agentId: String) {
    getAgentDetails(identifierId: $identifierId, agentId: $agentId) {
      fileName
      content
    }
  }
`;
