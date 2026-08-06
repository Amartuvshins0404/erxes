export type MastraProviderScope = 'organization' | 'personal';

export interface IMastraProvider {
  _id: string;
  provider: string;
  label?: string | null;
  scope: MastraProviderScope;
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
  updatedAt?: string;
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

export interface IAttachmentStorageStatusResponse {
  mastraAttachmentStorageStatus: IAttachmentStorage | null;
}

export interface IMastraSettings {
  _id?: string;
  erxesApiUrl?: string | null;
  memoryEnabled?: boolean | null;
  attachmentsEnabled?: boolean | null;
  learningEnabled?: boolean | null;
  learningAutoPromoteMinSources?: number | null;
  learningAutoPromoteMinConfidence?: number | null;
  learningDigestMaxChars?: number | null;
  learningDigestMaxEntries?: number | null;
  learningIdleMinutes?: number | null;
  learningDecayDays?: number | null;
  learningDecayFactor?: number | null;
  learningArchiveBelowConfidence?: number | null;
  evaluationEnabled?: boolean | null;
  evaluationDsnConfigured?: boolean | null;
  backgroundRemovalEnabled?: boolean | null;
  openSandboxApiUrl?: string | null;
  hasOpenSandboxApiKey?: boolean | null;
  openSandboxApiKeyHint?: string | null;
  attachmentStorage?: Pick<
    IAttachmentStorage,
    'configured' | 'serviceType'
  > | null;
}

export interface ISettingsResponse {
  mastraSettings: IMastraSettings | null;
}
