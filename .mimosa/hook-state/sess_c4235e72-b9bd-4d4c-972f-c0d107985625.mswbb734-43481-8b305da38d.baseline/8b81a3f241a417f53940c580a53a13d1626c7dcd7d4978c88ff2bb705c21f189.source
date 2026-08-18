import { gql } from '@apollo/client';

export const AGENT_DISCORD_CONNECT_URL = gql`
  query AgentDiscordConnectUrl($assistantId: String!, $returnUrl: String) {
    agentDiscordConnectUrl(assistantId: $assistantId, returnUrl: $returnUrl)
  }
`;

export const AGENT_DISCORD_INSTALLATIONS = gql`
  query AgentDiscordInstallations($assistantId: String!) {
    agentDiscordInstallations(assistantId: $assistantId)
  }
`;

export const AGENT_DISCORD_CHANNELS = gql`
  query AgentDiscordChannels($assistantId: String!, $installationId: String!) {
    agentDiscordChannels(
      assistantId: $assistantId
      installationId: $installationId
    )
  }
`;

export const AGENT_DISCORD_BINDINGS = gql`
  query AgentDiscordBindings($assistantId: String!) {
    agentDiscordBindings(assistantId: $assistantId)
  }
`;

export const AGENT_DISCORD_CREATE_BINDING = gql`
  mutation AgentDiscordCreateBinding(
    $assistantId: String!
    $installationId: String!
    $discordChannelId: String!
  ) {
    agentDiscordCreateBinding(
      assistantId: $assistantId
      installationId: $installationId
      discordChannelId: $discordChannelId
    )
  }
`;

export const AGENT_DISCORD_UPDATE_BINDING = gql`
  mutation AgentDiscordUpdateBinding(
    $assistantId: String!
    $bindingId: String!
    $input: UpdateDiscordBindingInput!
  ) {
    agentDiscordUpdateBinding(
      assistantId: $assistantId
      bindingId: $bindingId
      input: $input
    )
  }
`;

export const AGENT_DISCORD_DELETE_BINDING = gql`
  mutation AgentDiscordDeleteBinding(
    $assistantId: String!
    $bindingId: String!
  ) {
    agentDiscordDeleteBinding(assistantId: $assistantId, bindingId: $bindingId)
  }
`;
