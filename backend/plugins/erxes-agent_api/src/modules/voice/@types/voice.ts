import { Document } from 'mongoose';

// Per-tenant, bring-your-own-key voice (Chimege STT/TTS) configuration. Stored
// as a singleton document per tenant DB, mirroring MastraSettings. The two
// tokens are WRITE-ONLY over GraphQL — they are persisted here but never echoed
// back; the status query exposes booleans + the chosen voice only.
export interface IMastraVoiceConfig {
  // Chimege speech-to-text token (BYOK). Empty/undefined falls back to env.
  sttToken?: string;
  // Chimege text-to-speech token (BYOK). Empty/undefined falls back to env.
  ttsToken?: string;
  // One of the Chimege voice ids (e.g. FEMALE3v2). Empty falls back to env.
  ttsVoice?: string;
  // 8000 | 16000 | 22050. Empty/invalid falls back to env.
  ttsSampleRate?: number;
  // Master per-tenant switch. false turns both directions off regardless of
  // tokens (parallels ERXES_AGENT_VOICE=disable at the deployment level).
  isEnabled?: boolean;
}

export interface IMastraVoiceConfigDocument
  extends IMastraVoiceConfig,
    Document {
  _id: string;
}
