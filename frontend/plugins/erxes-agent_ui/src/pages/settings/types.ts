export interface IMastraProvider {
  _id: string;
  provider: string;
  label?: string | null;
  // apiKey is write-only: reads expose only these two secret-free fields.
  hasApiKey?: boolean | null;
  apiKeyHint?: string | null;
  baseUrl?: string | null;
  isDefault?: boolean | null;
  isEnabled?: boolean | null;
  isOpenAICompatible?: boolean | null;
  modelsEndpoint?: string | null;
  envKey?: string | null;
  // Header values are write-only; reads expose only the configured header names.
  headerKeys?: string[] | null;
  createdAt?: string;
}

export interface IMastraProviderPreset {
  provider: string;
  label: string;
  isOpenAICompatible?: boolean | null;
  envKey?: string | null;
  baseUrl?: string | null;
  modelsEndpoint?: string | null;
  headers?: Record<string, string> | null;
}

export interface IMastraProviderCatalogEntry {
  provider: string;
  label: string;
  isOpenAICompatible?: boolean | null;
  isConfigured?: boolean | null;
}

export interface IProvidersResponse {
  mastraProviders: IMastraProvider[];
}

export interface IProviderPresetsResponse {
  mastraProviderPresets: IMastraProviderPreset[];
}

export interface IProviderCatalogResponse {
  mastraProviderCatalog: IMastraProviderCatalogEntry[];
}

export interface IAttachmentStorage {
  configured?: boolean | null;
  serviceType?: string | null;
  enabled?: boolean | null;
}

export interface IMemoryStatusView {
  embedder?: string;
  embedderModel?: string;
  qdrantUrl?: string;
  qdrantReachable?: boolean | null;
  collection?: string;
}

export interface IKnowledgeStatusView extends IMemoryStatusView {
  enabled?: boolean;
  enabledTypes?: string[];
  lastSweepAt?: string | null;
  pointCount?: number | null;
  types?: Record<
    string,
    { count: number; points: number; error?: string }
  > | null;
  lastError?: string | null;
}

export interface IMastraSettings {
  _id?: string;
  erxesApiUrl?: string | null;
  erxesApiToken?: string | null;
  defaultAgentId?: string | null;
  attachmentsEnabled?: boolean | null;
  defaultAgentQuota?: number | null;
  attachmentStorage?: IAttachmentStorage | null;
  advancedMemory?: boolean | null;
  advancedMemoryStatus?: IMemoryStatusView | null;
  knowledgeStatus?: IKnowledgeStatusView | null;
}

export interface IMastraVoiceConfigStatus {
  enabled?: boolean | null;
  sttEnabled?: boolean | null;
  ttsEnabled?: boolean | null;
  sttConfigured?: boolean | null;
  ttsConfigured?: boolean | null;
  sttSource?: 'db' | 'env' | 'none' | null;
  ttsSource?: 'db' | 'env' | 'none' | null;
  ttsVoice?: string | null;
  ttsSampleRate?: number | null;
  isEnabled?: boolean | null;
}

export interface IMastraVoiceOption {
  id: string;
  label: string;
  gender: 'female' | 'male';
}

export interface IVoiceConfigResponse {
  mastraVoiceConfig: IMastraVoiceConfigStatus | null;
}

export interface IVoiceCatalogResponse {
  mastraVoiceCatalog: IMastraVoiceOption[];
}

export interface IMastraUserSettings {
  userId: string;
  agentQuota?: number | null;
}

export interface IUserAgentQuotaResponse {
  mastraUserAgentQuota: IMastraUserSettings | null;
}

export interface ISettingsResponse {
  mastraSettings: IMastraSettings | null;
}

export interface ISettingsAgentOption {
  _id: string;
  agentId: string;
  name: string;
  isEnabled: boolean;
}

export interface IAgentsResponse {
  mastraAgents: ISettingsAgentOption[];
}
