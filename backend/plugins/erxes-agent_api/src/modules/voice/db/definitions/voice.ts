import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

// Singleton per tenant (one doc per tenant DB), like MastraSettings. Tokens are
// stored here but never returned over GraphQL — see the resolvers.
export const voiceConfigSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    sttToken: { type: String, label: 'Chimege STT token' },
    ttsToken: { type: String, label: 'Chimege TTS token' },
    ttsVoice: { type: String, label: 'TTS voice id' },
    ttsSampleRate: { type: Number, label: 'TTS sample rate' },
    isEnabled: { type: Boolean, default: true, label: 'Voice enabled' },
  },
  { timestamps: true },
);
