import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IMastraVoiceConfig } from '@/voice/@types/voice';
import {
  CHIMEGE_VOICE_IDS,
  CHIMEGE_SAMPLE_RATES,
} from '~/mastra/voice/voices';
import { resolveVoiceStatusForTenant } from '~/mastra/voice/resolveConfig';

/** Mutations for the tenant's Chimege voice (BYOK) configuration. */
export const voiceMutations = {
  mastraVoiceConfigSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraVoiceConfig },
    { models, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('settingsManage');

    if (
      doc.ttsVoice !== undefined &&
      doc.ttsVoice !== '' &&
      !CHIMEGE_VOICE_IDS.has(doc.ttsVoice)
    ) {
      throw new ExpectedError(`Unknown voice: ${doc.ttsVoice}`);
    }
    if (
      doc.ttsSampleRate !== undefined &&
      doc.ttsSampleRate !== null &&
      !CHIMEGE_SAMPLE_RATES.has(doc.ttsSampleRate)
    ) {
      throw new ExpectedError(`Unsupported sample rate: ${doc.ttsSampleRate}`);
    }

    await models.MastraVoiceConfig.saveVoiceConfig(doc);

    // Return the secret-free status so the UI reflects the new state without a
    // second round-trip. Tokens are never echoed.
    const status = await resolveVoiceStatusForTenant(subdomain);
    return {
      ...status,
      sttConfigured: status.sttSource !== 'none',
      ttsConfigured: status.ttsSource !== 'none',
    };
  },
};
