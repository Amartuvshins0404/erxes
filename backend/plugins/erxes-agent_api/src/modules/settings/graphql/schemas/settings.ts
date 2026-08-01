export const types = `
  # Where chat attachments land: the instance's existing upload storage,
  # detected from core's file-upload configs. enabled = configured AND the
  # plugin-level toggle is on — when false the chat stays text-only.
  type MastraAttachmentStorageStatus {
    configured: Boolean
    serviceType: String
    enabled: Boolean
  }

  type MastraSettings {
    _id: String
    erxesApiUrl: String
    memoryEnabled: Boolean
    attachmentsEnabled: Boolean
    attachmentStorage: MastraAttachmentStorageStatus
    learningEnabled: Boolean
    learningAutoPromoteMinSources: Int
    learningAutoPromoteMinConfidence: Float
    learningDigestMaxChars: Int
    learningDigestMaxEntries: Int
    learningIdleMinutes: Int
    learningDecayDays: Int
    learningDecayFactor: Float
    learningArchiveBelowConfidence: Float
    evaluationEnabled: Boolean
    evaluationDsnConfigured: Boolean
    backgroundRemovalEnabled: Boolean
    summarizerProvider: String
    summarizerModel: String
  }

  input MastraSettingsInput {
    erxesApiUrl: String
    memoryEnabled: Boolean
    attachmentsEnabled: Boolean
    learningEnabled: Boolean
    learningAutoPromoteMinSources: Int
    learningAutoPromoteMinConfidence: Float
    learningDigestMaxChars: Int
    learningDigestMaxEntries: Int
    learningIdleMinutes: Int
    learningDecayDays: Int
    learningDecayFactor: Float
    learningArchiveBelowConfidence: Float
    evaluationEnabled: Boolean
    evaluationDsn: String
    backgroundRemovalEnabled: Boolean
    summarizerProvider: String
    summarizerModel: String
  }
`;

export const queries = `
  mastraSettings: MastraSettings
  mastraAttachmentStorageStatus: MastraAttachmentStorageStatus
`;

export const mutations = `
  mastraSettingsSave(doc: MastraSettingsInput!): MastraSettings
`;
