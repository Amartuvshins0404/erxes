import { gql } from '@apollo/client';

export const GET_DISCORD_GUILDS = gql`
  query GetDiscordGuilds($identifierId: String!) {
    getDiscordGuilds(identifierId: $identifierId) {
      guildId
      requireMention
    }
  }
`;

export const GET_AGENTS_LIST = gql`
  query GetAgentsList($identifierId: String!) {
    getAgentsList(identifierId: $identifierId) {
      id
      identity
    }
  }
`;

export const GET_AGENT_DETAILS = gql`
  query GetAgentDetails($identifierId: String!, $agentId: String) {
    getAgentDetails(identifierId: $identifierId, agentId: $agentId) {
      fileName
      content
    }
  }
`;

export const CHECK_KIMI_KEY_SET = gql`
  query CheckKimiKeySet($identifierId: String!) {
    checkKimiKeySet(identifierId: $identifierId)
  }
`;
