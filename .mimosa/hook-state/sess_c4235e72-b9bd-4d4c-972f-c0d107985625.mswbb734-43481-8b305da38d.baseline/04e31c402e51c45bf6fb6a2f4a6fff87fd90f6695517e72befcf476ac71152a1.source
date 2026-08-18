import { gql } from '@apollo/client';

export const UPDATE_AGENT_FILE = gql`
  mutation UpdateAgentFile(
    $identifierId: String!
    $input: UpdateAgentFileInput!
  ) {
    updateAgentFile(identifierId: $identifierId, input: $input)
  }
`;

export const ADD_AGENT = gql`
  mutation AddAgent($identifierId: String!, $input: AddAgentInput!) {
    addAgent(identifierId: $identifierId, input: $input)
  }
`;

export const FIX_AND_RESTART_AGENT = gql`
  mutation FixAndRestartAgent($identifierId: String!) {
    fixAndRestartAgent(identifierId: $identifierId)
  }
`;

export const UPDATE_DISCORD_SETTINGS = gql`
  mutation UpdateDiscordSettings(
    $identifierId: String!
    $input: UpdateDiscordSettingsInput!
  ) {
    updateDiscordSettings(identifierId: $identifierId, input: $input)
  }
`;

export const ADD_DISCORD_GUILD = gql`
  mutation AddDiscordGuild(
    $identifierId: String!
    $input: AddDiscordGuildInput!
  ) {
    addDiscordGuild(identifierId: $identifierId, input: $input)
  }
`;

export const SET_AGENT_LLM_CONNECTION = gql`
  mutation SetAgentLlmConnection(
    $identifierId: String!
    $input: SetAgentLlmConnectionInput!
  ) {
    setAgentLlmConnection(identifierId: $identifierId, input: $input) {
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
      status
      updatedAt
    }
  }
`;

export const START_AGENT_LLM_SUBSCRIPTION_AUTH = gql`
  mutation StartAgentLlmSubscriptionAuth($identifierId: String!) {
    startAgentLlmSubscriptionAuth(identifierId: $identifierId) {
      ok
      status
      message
      records
    }
  }
`;
