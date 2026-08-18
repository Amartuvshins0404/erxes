import { gql } from '@apollo/client';

export const AGENT_MANAGED_LLM_MODELS = gql`
  query AgentManagedLlmModels($provider: String!, $apiKey: String!) {
    agentManagedLlmModels(provider: $provider, apiKey: $apiKey) {
      id
      name
    }
  }
`;
