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

export type MastraSandboxMode = 'onserver' | 'isolated';

export interface IMastraSettings {
  _id?: string;
  erxesApiUrl?: string | null;
  memoryEnabled?: boolean | null;
  attachmentsEnabled?: boolean | null;
  backgroundRemovalEnabled?: boolean | null;
  sandboxMode?: MastraSandboxMode | null;
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
