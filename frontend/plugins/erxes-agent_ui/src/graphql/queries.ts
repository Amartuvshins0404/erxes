import { gql } from '@apollo/client';

export const AGENT_FIELDS = gql`
  fragment AgentFields on MastraAgent {
    _id
    name
    agentId
    description
    instructions
    provider
    model
    grantGroupId
    skills
    destructiveOps
    memoryEnabled
    debug
    maxSteps
    temperature
    isEnabled
    visibility
    teamId
    departmentId
    unitId
    isOwnAgent
    createdAt
    updatedAt
    capabilities {
      canReadConfig
      canChat
      canEdit
      canRemove
      canShare
      canTransferOwnership
      canManageGrant
      canReadWorkflows
      canReadSkills
      canReadLearnings
    }
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
    approvalStatus
    approvedByUserId
    approvedAt
    capabilities {
      canUpdate
      canRemove
      canRun
      canApprove
      canSchedule
      canReadRuns
    }
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
        name
        agentId
        description
        isEnabled
        visibility
        teamId
        departmentId
        unitId
        isOwnAgent
        createdAt
        workflowsCount
        capabilities {
          canReadConfig
          canChat
          canEdit
          canRemove
          canShare
          canTransferOwnership
          canManageGrant
          canReadWorkflows
          canReadSkills
          canReadLearnings
        }
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

export const MASTRA_VOICE_STATUS = gql`
  query MastraVoiceStatus {
    mastraVoiceStatus {
      enabled
    }
  }
`;

export const MASTRA_VOICE_CONFIG = gql`
  query MastraVoiceConfig {
    mastraVoiceConfig {
      enabled
      sttEnabled
      ttsEnabled
      sttConfigured
      ttsConfigured
      sttSource
      ttsSource
      ttsVoice
      ttsSampleRate
      isEnabled
    }
  }
`;

export const MASTRA_VOICE_CATALOG = gql`
  query MastraVoiceCatalog {
    mastraVoiceCatalog {
      id
      label
      gender
    }
  }
`;

export const MASTRA_PROVIDERS = gql`
  query MastraProviders {
    mastraProviders {
      _id
      provider
      label
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
      erxesApiToken
      defaultAgentId
      attachmentsEnabled
      defaultAgentQuota
      attachmentStorage {
        configured
        serviceType
        enabled
      }
      advancedMemory
    }
  }
`;

export const MASTRA_MY_AGENT_QUOTA_STATUS = gql`
  query MastraMyAgentQuotaStatus {
    mastraMyAgentQuotaStatus {
      count
      quota
      atQuota
    }
  }
`;

export const MASTRA_USER_AGENT_QUOTA = gql`
  query MastraUserAgentQuota($userId: String!) {
    mastraUserAgentQuota(userId: $userId) {
      userId
      agentQuota
    }
  }
`;

export const AGENT_FORM_BRANCHES = gql`
  query AgentFormBranches {
    branches {
      _id
      title
    }
  }
`;

export const AGENT_FORM_DEPARTMENTS = gql`
  query AgentFormDepartments {
    departments {
      _id
      title
    }
  }
`;

export const AGENT_FORM_UNITS = gql`
  query AgentFormUnits {
    units {
      _id
      title
      departmentId
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
