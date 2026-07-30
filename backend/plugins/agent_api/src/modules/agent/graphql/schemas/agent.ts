export const types = `
  enum AgentDeploymentStatus {
    deploying
    pending
    approved
    failed
  }

  type AgentProvisioningProgress {
    stage: String
    message: String
    startedAt: Date
    updatedAt: Date
    error: String
  }

  type AgentServer {
    _id: String

    identifierId: String
    name: String
    url: String
    token: String

    agentId: String
    serverId: String
    status: AgentDeploymentStatus!
    provisioning: AgentProvisioningProgress
    transferredFromSubdomain: String
    transferredAt: Date

    createdAt: Date
    updatedAt: Date
  }

  type AgentFile {
    fileName: String
    content: String
  }

  type AgentTransferCredentials {
    kind: String
    sourceSubdomain: String
    serverName: String
    serverUrl: String
    gatewayToken: String
    agentId: String
    serverId: String
    status: String
  }

  input DeployAgentInput {
    token: String!
    kimiApiKey: String!
  }

  input DeployManagedAgentInput {
    provider: String
    kimiApiKey: String!
    description: String
    systemPrompt: String
  }

  input TransferAgentInput {
    serverName: String!
    gatewayToken: String!
    serverUrl: String
    agentId: String
    serverId: String
    sourceSubdomain: String
  }

  input ApproveAgentInput {
    code: String!
  }

  type AgentItem {
    id: String
    identity: JSON
  }

  input AddAgentInput {
    agentId: String!
    botName: String!
  }

  input UpdateAgentFileInput {
    filename: String!
    content: String!
    agentId: String
  }

  input UpdateDiscordSettingsInput {
    botToken: String!
    dmPolicy: String
  }

  input AddDiscordGuildInput {
    guildId: String!
  }

  input UpdateDiscordBindingInput {
    responseMode: String
    enabled: Boolean
  }

  input SetKimiApiKeyInput {
    kimiApiKey: String!
  }

  type DiscordGuild {
    guildId: String
    requireMention: Boolean
  }

  type AgentRuntimeResult {
    ok: Boolean!
    status: String
    stage: String
    message: String
    warnings: [String]
    diagnostics: JSON
    items: JSON
    records: JSON
  }
`;

export const queries = `
  getAgent(identifierId: String!): AgentServer
  getAgentsList(identifierId: String!): [AgentItem]
  getAgentDetails(identifierId: String!, agentId: String): [AgentFile]
  getDiscordGuilds(identifierId: String!): [DiscordGuild]
  checkKimiKeySet(identifierId: String!): Boolean
  agentDiscordConnectUrl(assistantId: String!, returnUrl: String): String
  agentDiscordInstallations(assistantId: String!): JSON
  agentDiscordChannels(assistantId: String!, installationId: String!): JSON
  agentDiscordBindings(assistantId: String!): JSON
  agentRuntimeDiagnostics(agentId: String!): AgentRuntimeResult
  agentRuntimeSkills(agentId: String!): AgentRuntimeResult
  agentRuntimeSkillSearch(agentId: String!, query: String!): AgentRuntimeResult
  agentRuntimePlugins(agentId: String!): AgentRuntimeResult
  agentRuntimePluginSearch(agentId: String!, query: String!): AgentRuntimeResult
  agentRuntimePluginInspect(agentId: String!, pluginId: String!): AgentRuntimeResult
  agentRuntimePluginDoctor(agentId: String!): AgentRuntimeResult
`;

export const mutations = `
  deployAgent(identifierId: String!, input: DeployAgentInput!): AgentServer
  deployManagedAgent(identifierId: String!, input: DeployManagedAgentInput!): AgentServer
  transferAgent(identifierId: String!, input: TransferAgentInput!): AgentServer
  createAgentTransferCredentials(identifierId: String!): AgentTransferCredentials
  destroyAgent(identifierId: String!): AgentServer
  approveAgent(identifierId: String!, input: ApproveAgentInput!): AgentServer
  addAgent(identifierId: String!, input: AddAgentInput!): Boolean
  updateAgentFile(identifierId: String!, input: UpdateAgentFileInput!): Boolean
  fixAndRestartAgent(identifierId: String!): Boolean
  updateDiscordSettings(identifierId: String!, input: UpdateDiscordSettingsInput!): Boolean
  addDiscordGuild(identifierId: String!, input: AddDiscordGuildInput!): Boolean
  setKimiApiKey(identifierId: String!, input: SetKimiApiKeyInput!): Boolean
  agentDiscordCreateBinding(assistantId: String!, installationId: String!, discordChannelId: String!): JSON
  agentDiscordUpdateBinding(assistantId: String!, bindingId: String!, input: UpdateDiscordBindingInput!): JSON
  agentDiscordDeleteBinding(assistantId: String!, bindingId: String!): JSON
  agentRuntimeInstallSkill(agentId: String!, slug: String!, version: String): AgentRuntimeResult
  agentRuntimeInstallPlugin(agentId: String!, plugin: String!, version: String): AgentRuntimeResult
  agentRuntimeEnablePlugin(agentId: String!, pluginId: String!): AgentRuntimeResult
`;
