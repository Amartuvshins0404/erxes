export const types = `
  # Where chat attachments land: the instance's existing upload storage,
  # detected from core's file-upload configs. enabled = configured AND the
  # plugin-level toggle is on — when false the chat stays text-only.
  type MastraAttachmentStorageStatus {
    configured: Boolean
    serviceType: String
    enabled: Boolean
  }

  # Whether voice mode (Chimege Mongolian STT + TTS) is usable: a CHIMEGE_TOKEN
  # resolves AND the feature is not disabled. When false the chat UI hides
  # the voice mode entry point.
  type MastraVoiceStatus {
    enabled: Boolean
  }

  type MastraSettings {
    _id: String
    erxesApiUrl: String
    hasErxesApiToken: Boolean
    defaultAgentId: String
    attachmentsEnabled: Boolean
    attachmentStorage: MastraAttachmentStorageStatus

    # Read-only: the "Advanced memory feature" is controlled by the
    # ERXES_AGENT_MEMORY env var, not by app data. Surfaced for display only.
    advancedMemory: Boolean
  }

  input MastraSettingsInput {
    erxesApiUrl: String
    erxesApiToken: String
    defaultAgentId: String
    attachmentsEnabled: Boolean
  }
`;

export const queries = `
  mastraSettings: MastraSettings
  mastraAttachmentStorageStatus: MastraAttachmentStorageStatus
  mastraVoiceStatus: MastraVoiceStatus
`;

export const mutations = `
  mastraSettingsSave(doc: MastraSettingsInput!): MastraSettings
`;
