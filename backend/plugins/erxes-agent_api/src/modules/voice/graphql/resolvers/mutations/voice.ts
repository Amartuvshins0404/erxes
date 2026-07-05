import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IMastraVoiceConfig } from '@/voice/@types/voice';
import {
  CHIMEGE_VOICE_IDS,
  CHIMEGE_SAMPLE_RATES,
} from '~/mastra/voice/voices';
import { isValidChimegeToken } from '~/mastra/voice/chimegeVoice';
import { resolveVoiceStatusForTenant } from '~/mastra/voice/resolveConfig';

// Validate + normalise a bring-your-own-key token in place before it is
// persisted. Empty/whitespace-only is left untouched: saveVoiceConfig treats a
// blank token as "keep the stored secret" (write-only field), so policing it
// would change the clear/keep semantics. For a real value we trim padding, then
// reject anything that can't be sent as the Chimege HTTP `token` header —
// whitespace or non-Latin-1 chars (e.g. a pasted Cyrillic sentence), which
// would otherwise blow up at fetch() time with an opaque ByteString error.
function normalizeVoiceToken(
  doc: IMastraVoiceConfig,
  field: 'sttToken' | 'ttsToken',
  label: string,
): void {
  const raw = doc[field];
  if (typeof raw !== 'string' || raw.trim() === '') return;
  const trimmed = raw.trim();
  if (!isValidChimegeToken(trimmed)) {
    throw new ExpectedError(
      `That doesn't look like a Chimege ${label} token — paste it exactly as issued (letters/digits only).`,
    );
  }
  doc[field] = trimmed;
}

/** Mutations for the tenant's Chimege voice (BYOK) configuration. */
export const voiceMutations = {
  mastraVoiceConfigSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraVoiceConfig },
    { models, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('settingsManage');

    normalizeVoiceToken(doc, 'sttToken', 'STT');
    normalizeVoiceToken(doc, 'ttsToken', 'TTS');

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
