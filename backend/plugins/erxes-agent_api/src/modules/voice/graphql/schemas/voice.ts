export const types = `
  # Secret-free view of a tenant's Chimege voice (BYOK) configuration. The STT
  # and TTS tokens are NEVER returned — only whether each direction is
  # configured/usable, where its token came from (db | env | none), and the
  # chosen voice (which is not a secret).
  type MastraVoiceConfigStatus {
    enabled: Boolean
    sttEnabled: Boolean
    ttsEnabled: Boolean
    sttConfigured: Boolean
    ttsConfigured: Boolean
    sttSource: String
    ttsSource: String
    ttsVoice: String
    ttsSampleRate: Int
    isEnabled: Boolean
  }

  # One selectable Chimege voice. Not secret — drives the settings selector.
  type MastraVoiceOption {
    id: String
    label: String
    gender: String
  }

  # Tokens are WRITE-ONLY: send a non-empty value to set/replace, omit or send
  # empty to leave the stored secret unchanged.
  input MastraVoiceConfigInput {
    sttToken: String
    ttsToken: String
    ttsVoice: String
    ttsSampleRate: Int
    isEnabled: Boolean
  }
`;

export const queries = `
  mastraVoiceConfig: MastraVoiceConfigStatus
  mastraVoiceCatalog: [MastraVoiceOption]
`;

export const mutations = `
  mastraVoiceConfigSave(doc: MastraVoiceConfigInput!): MastraVoiceConfigStatus
`;
