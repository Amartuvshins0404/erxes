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
      provider
      model
      credentialMode
      credentialStatus
      createdAt
      updatedAt
      status
      transferredAt
      transferredFromSubdomain
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

export const AGENT_LLM_SUBSCRIPTION_AUTH_STATUS = gql`
  query AgentLlmSubscriptionAuthStatus($identifierId: String!) {
    agentLlmSubscriptionAuthStatus(identifierId: $identifierId) {
      ok
      status
      message
      records
    }
  }
`;

export const AGENT_RUNTIME_HEALTH = gql`
  query AgentRuntimeHealth($identifierId: String!) {
    agentRuntimeHealth(identifierId: $identifierId) {
      healthy
    }
  }
`;
