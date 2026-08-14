import { gql } from '@apollo/client';

export const AGENT_FIELDS = gql`
  fragment AgentFields on MastraAgent {
    _id
    accountName
    accountDescription
    createdBy
    visibility
    audienceUserIds
    permissionGroupIds
    instructions
    provider
    model
    additionalTools
    isActive
    createdAt
    updatedAt
  }
`;

export const MASTRA_AGENT_ADDITIONAL_TOOLS = gql`
  query MastraAgentAdditionalTools {
    mastraAgentAdditionalTools
  }
`;

export const MASTRA_AGENTS = gql`
  query MastraAgents {
    mastraAgents {
      ...AgentFields
    }
  }
  ${AGENT_FIELDS}
`;

export const MASTRA_AGENTS_MAIN = gql`
  query MastraAgentsMain($page: Int, $perPage: Int, $searchValue: String) {
    mastraAgentsMain(
      page: $page
      perPage: $perPage
      searchValue: $searchValue
    ) {
      list {
        _id
        accountName
        accountDescription
        createdBy
        visibility
        audienceUserIds
        provider
        model
        permissionGroupIds
        isActive
        createdAt
      }
      totalCount
    }
  }
`;

export const MASTRA_AGENT = gql`
  query MastraAgent($_id: String!) {
    mastraAgent(_id: $_id) {
      ...AgentFields
    }
  }
  ${AGENT_FIELDS}
`;

export const MASTRA_THREADS = gql`
  query MastraThreads($agentId: String!, $page: Int, $perPage: Int) {
    mastraThreads(agentId: $agentId, page: $page, perPage: $perPage) {
      list {
        _id
        threadId
        title
        lastMessageAt
        createdAt
      }
      totalCount
    }
  }
`;

export const MASTRA_THREAD_MESSAGES = gql`
  query MastraThreadMessages($threadId: String!) {
    mastraThreadMessages(threadId: $threadId) {
      _id
      role
      content
      parts
      meta
      attachments
      createdAt
    }
  }
`;

export const MASTRA_THREAD_ARTIFACTS = gql`
  query MastraThreadArtifacts($threadId: String!) {
    mastraThreadArtifacts(threadId: $threadId)
  }
`;

export const MASTRA_ATTACHMENT_STORAGE_STATUS = gql`
  query MastraAttachmentStorageStatus {
    mastraAttachmentStorageStatus {
      configured
      serviceType
      enabled
    }
  }
`;

export const MASTRA_PROVIDERS = gql`
  query MastraProviders($scope: MastraProviderScope) {
    mastraProviders(scope: $scope) {
      _id
      provider
      label
      scope
      hasApiKey
      apiKeyHint
      baseUrl
      isDefault
      isEnabled
      isOpenAICompatible
      modelsEndpoint
      envKey
      headerKeys
      createdAt
      updatedAt
    }
  }
`;

export const MASTRA_PROVIDER_CATALOG = gql`
  query MastraProviderCatalog {
    mastraProviderCatalog {
      provider
      label
      isOpenAICompatible
      isConfigured
    }
  }
`;

export const MASTRA_PROVIDER_PRESETS = gql`
  query MastraProviderPresets {
    mastraProviderPresets {
      provider
      label
      isOpenAICompatible
      envKey
      baseUrl
      modelsEndpoint
      headers
    }
  }
`;

export const MASTRA_PROVIDER_MODELS = gql`
  query MastraProviderModels($provider: String!) {
    mastraProviderModels(provider: $provider) {
      id
      name
    }
  }
`;

export const MASTRA_SETTINGS = gql`
  query MastraSettings {
    mastraSettings {
      _id
      erxesApiUrl
      memoryEnabled
      attachmentsEnabled
      backgroundRemovalEnabled
      sandboxMode
      openSandboxApiUrl
      hasOpenSandboxApiKey
      openSandboxApiKeyHint
      attachmentStorage {
        configured
        serviceType
      }
    }
  }
`;
