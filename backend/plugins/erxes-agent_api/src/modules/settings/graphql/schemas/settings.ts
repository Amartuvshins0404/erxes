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
  }

  input MastraSettingsInput {
    erxesApiUrl: String
    memoryEnabled: Boolean
    attachmentsEnabled: Boolean
  }
`;

export const queries = `
  mastraSettings: MastraSettings
  mastraAttachmentStorageStatus: MastraAttachmentStorageStatus
`;

export const mutations = `
  mastraSettingsSave(doc: MastraSettingsInput!): MastraSettings
`;
