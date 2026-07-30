import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { voiceConfigSchema } from '@/voice/db/definitions/voice';
import {
  IMastraVoiceConfig,
  IMastraVoiceConfigDocument,
} from '@/voice/@types/voice';

export interface IMastraVoiceConfigModel
  extends Model<IMastraVoiceConfigDocument> {
  getVoiceConfig(): Promise<IMastraVoiceConfigDocument | null>;
  saveVoiceConfig(
    doc: IMastraVoiceConfig,
  ): Promise<IMastraVoiceConfigDocument>;
}

// A token field arriving empty/undefined means "leave the stored secret as-is",
// so the masked UI can update the voice or sample rate without re-typing keys.
// Non-empty replaces; this keeps tokens write-only end to end.
function pickTokenUpdate(
  next: string | undefined,
  set: Record<string, unknown>,
  field: 'sttToken' | 'ttsToken',
) {
  if (typeof next === 'string' && next.trim()) {
    set[field] = next.trim();
  }
}

export const loadVoiceConfigClass = (_models: IModels) => {
  class MastraVoiceConfig {
    public static async getVoiceConfig() {
      return _models.MastraVoiceConfig.findOne({});
    }

    public static async saveVoiceConfig(doc: IMastraVoiceConfig) {
      const set: Record<string, unknown> = {};
      pickTokenUpdate(doc.sttToken, set, 'sttToken');
      pickTokenUpdate(doc.ttsToken, set, 'ttsToken');
      if (doc.ttsVoice !== undefined) set.ttsVoice = doc.ttsVoice;
      if (doc.ttsSampleRate !== undefined) set.ttsSampleRate = doc.ttsSampleRate;
      if (doc.isEnabled !== undefined) set.isEnabled = doc.isEnabled;

      const existing = await _models.MastraVoiceConfig.findOne({});
      if (existing) {
        return _models.MastraVoiceConfig.findOneAndUpdate(
          { _id: existing._id },
          { $set: set },
          { new: true },
        );
      }
      return _models.MastraVoiceConfig.create(set);
    }
  }

  voiceConfigSchema.loadClass(MastraVoiceConfig);
  return voiceConfigSchema;
};
