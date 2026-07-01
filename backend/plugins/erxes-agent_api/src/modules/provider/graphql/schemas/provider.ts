export const types = `
  type MastraProvider {
    _id: String
    provider: String
    label: String
    # apiKey is WRITE-ONLY: it is never returned. Reads expose only whether a
    # key is stored (hasApiKey) and a masked last-4 hint (apiKeyHint).
    hasApiKey: Boolean
    apiKeyHint: String
    baseUrl: String
    isDefault: Boolean
    isEnabled: Boolean
    isOpenAICompatible: Boolean
    modelsEndpoint: String
    envKey: String
    # Custom header VALUES are WRITE-ONLY (they can carry auth secrets like
    # Authorization/Bearer). Reads expose only the configured header NAMES.
    headerKeys: [String]
    createdAt: Date
  }

  input MastraProviderInput {
    provider: String!
    label: String
    # Send a non-empty value to set/replace the key; omit or send blank to leave
    # the stored secret unchanged (mirrors the voice BYOK module).
    apiKey: String
    baseUrl: String
    isDefault: Boolean
    isEnabled: Boolean
    isOpenAICompatible: Boolean
    modelsEndpoint: String
    envKey: String
    # Write-only: send a non-empty map to set/replace headers; omit or send an
    # empty map to leave the stored headers unchanged.
    headers: JSON
  }

  type MastraProviderModel {
    id: String
    name: String
  }

  type MastraProviderCatalogEntry {
    provider: String
    label: String
    isOpenAICompatible: Boolean
    isConfigured: Boolean
  }

  type MastraProviderPreset {
    provider: String
    label: String
    isOpenAICompatible: Boolean
    envKey: String
    baseUrl: String
    modelsEndpoint: String
    headers: JSON
  }
`;

export const queries = `
  mastraProviders: [MastraProvider]
  mastraProvider(_id: String!): MastraProvider
  mastraProviderCatalog: [MastraProviderCatalogEntry]
  mastraProviderModels(provider: String!): [MastraProviderModel]
  mastraProviderPresets: [MastraProviderPreset]
`;

export const mutations = `
  mastraProviderSave(doc: MastraProviderInput!): MastraProvider
  mastraProviderRemove(_id: String!): JSON
`;
