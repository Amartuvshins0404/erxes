import { gql } from '@apollo/client';

export const AGENT_FIELDS = gql`
  fragment AgentFields on MastraAgent {
    _id
    accountName
    accountDescription
    createdBy
    visibility
    audienceUserIds
    audienceTeamIds
    audienceDepartmentIds
    permissionGroupIds
    instructions
    provider
    model
    skills
    additionalTools
    destructiveOps
    memoryEnabled
    debug
    temperature
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

export const WORKFLOW_FIELDS = gql`
  fragment WorkflowFields on MastraWorkflow {
    _id
    name
    description
    agentId
    definition
    version
    isEnabled
    createdAt
    updatedAt
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
        skills
        permissionGroupIds
        isActive
        workflowsCount
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
      learningEnabled
      learningAutoPromoteMinSources
      learningAutoPromoteMinConfidence
      learningDigestMaxChars
      learningDigestMaxEntries
      learningIdleMinutes
      learningDecayDays
      learningDecayFactor
      learningArchiveBelowConfidence
      evaluationEnabled
      evaluationDsnConfigured
      backgroundRemovalEnabled
      summarizerProvider
      summarizerModel
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

export const MASTRA_LEARNINGS = gql`
  query MastraLearnings(
    $status: String
    $type: String
    $searchValue: String
    $page: Int
    $perPage: Int
  ) {
    mastraLearnings(
      status: $status
      type: $type
      searchValue: $searchValue
      page: $page
      perPage: $perPage
    ) {
      list {
        _id
        statement
        type
        contextTags
        agentId
        status
        confidence
        evidenceCount
        sourceCount
        pinned
        createdBy
        lastReinforcedAt
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const MASTRA_LEARNING_STATS = gql`
  query MastraLearningStats {
    mastraLearningStats
  }
`;

export const MASTRA_MESSAGE_FEEDBACKS = gql`
  query MastraMessageFeedbacks($threadId: String!) {
    mastraMessageFeedbacks(threadId: $threadId)
  }
`;

export const MASTRA_WORKFLOWS = gql`
  query MastraWorkflows($agentId: String) {
    mastraWorkflows(agentId: $agentId) {
      ...WorkflowFields
    }
  }
  ${WORKFLOW_FIELDS}
`;

export const MASTRA_WORKFLOW = gql`
  query MastraWorkflow($_id: String!) {
    mastraWorkflow(_id: $_id) {
      ...WorkflowFields
      createdByUserId
    }
  }
  ${WORKFLOW_FIELDS}
`;

export const MASTRA_WORKFLOW_RUNS = gql`
  query MastraWorkflowRuns($workflowId: String!, $page: Int, $perPage: Int) {
    mastraWorkflowRuns(
      workflowId: $workflowId
      page: $page
      perPage: $perPage
    ) {
      _id
      workflowId
      version
      runId
      status
      triggerEnvelope
      stepsSummary
      output
      error
      usage
      startedAt
      finishedAt
      createdAt
    }
  }
`;
