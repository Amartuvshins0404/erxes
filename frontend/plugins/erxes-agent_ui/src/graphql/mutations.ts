import { gql } from '@apollo/client';
import { AGENT_FIELDS } from './queries';

export const MASTRA_THREAD_RENAME = gql`
  mutation MastraThreadRename($threadId: String!, $title: String!) {
    mastraThreadRename(threadId: $threadId, title: $title) {
      _id
      threadId
      title
    }
  }
`;

export const MASTRA_THREAD_REMOVE = gql`
  mutation MastraThreadRemove($threadId: String!) {
    mastraThreadRemove(threadId: $threadId)
  }
`;

export const MASTRA_MESSAGE_PAIR_REMOVE = gql`
  mutation MastraMessagePairRemove($threadId: String!, $messageId: String!) {
    mastraMessagePairRemove(threadId: $threadId, messageId: $messageId)
  }
`;

export const MASTRA_CHAT_CANCEL = gql`
  mutation MastraChatCancel($threadId: String!) {
    mastraChatCancel(threadId: $threadId)
  }
`;

export const MASTRA_AGENT_CREATE = gql`
  mutation MastraAgentCreate($doc: MastraAgentInput!) {
    mastraAgentCreate(doc: $doc) {
      ...AgentFields
    }
  }
  ${AGENT_FIELDS}
`;

export const MASTRA_AGENT_UPDATE = gql`
  mutation MastraAgentUpdate($_id: String!, $doc: MastraAgentInput!) {
    mastraAgentUpdate(_id: $_id, doc: $doc) {
      ...AgentFields
    }
  }
  ${AGENT_FIELDS}
`;

export const MASTRA_AGENT_REMOVE = gql`
  mutation MastraAgentRemove($_id: String!) {
    mastraAgentRemove(_id: $_id)
  }
`;

export const MASTRA_PROVIDER_SAVE = gql`
  mutation MastraProviderSave($doc: MastraProviderInput!) {
    mastraProviderSave(doc: $doc) {
      _id
      provider
      label
      scope
      isDefault
      isEnabled
      isOpenAICompatible
      modelsEndpoint
      envKey
    }
  }
`;

export const MASTRA_PROVIDER_REMOVE = gql`
  mutation MastraProviderRemove($_id: String!) {
    mastraProviderRemove(_id: $_id)
  }
`;

export const MASTRA_SETTINGS_SAVE = gql`
  mutation MastraSettingsSave($doc: MastraSettingsInput!) {
    mastraSettingsSave(doc: $doc) {
      _id
      erxesApiUrl
      memoryEnabled
      attachmentsEnabled
      backgroundRemovalEnabled
      sandboxMode
      openSandboxApiUrl
      hasOpenSandboxApiKey
      openSandboxApiKeyHint
    }
  }
`;
