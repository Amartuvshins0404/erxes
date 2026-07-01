// ---------------------------------------------------------------------------
// PURE per-tenant voice resolution — no I/O, no heavy imports, fully
// unit-testable. Resolves a tenant's stored Chimege config (bring-your-own-key)
// over the env-derived defaults. The DB read that feeds this lives in
// ./resolveConfig.ts (which drags in connectionResolvers); keeping the logic
// here means the tests never load that graph.
//
// Precedence, per field:
//   token → DB token if non-empty, else env token
//   voice → DB voice if set,       else env voice
//   rate  → DB rate if valid,      else env rate
// Gating is per-direction: a direction is enabled iff its RESOLVED token is
// present AND voice is not turned off — by the deployment kill switch
// (ERXES_AGENT_VOICE=disable) or by the tenant's own isEnabled === false.
// ---------------------------------------------------------------------------

import { IMastraVoiceConfig } from '@/voice/@types/voice';
import { VoiceConfig } from '~/mastra/voice/config';
import { CHIMEGE_SAMPLE_RATES } from '~/mastra/voice/voices';

// Lightweight, secret-free view for status queries (chat UI + settings page).
export interface VoiceStatus {
  // Round-trip readiness — drives the chat voice-mode entry point.
  enabled: boolean;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  // Whether each direction's token came from the tenant DB or the env fallback.
  // 'none' when neither supplies it.
  sttSource: 'db' | 'env' | 'none';
  ttsSource: 'db' | 'env' | 'none';
  // The resolved voice — safe to show (it is not a secret).
  ttsVoice: string;
  ttsSampleRate: number;
  // The tenant's master switch (false → both directions forced off).
  isEnabled: boolean;
}

export interface MergeOpts {
  // The deployment-wide kill switch (ERXES_AGENT_VOICE=disable). Passed in
  // explicitly so this stays a pure function of its inputs.
  globallyDisabled?: boolean;
}

/**
 * Merge a tenant's stored voice config over the env-derived config. `stored` is
 * null when the tenant has saved nothing.
 */
export function mergeVoiceConfig(
  env: VoiceConfig,
  stored: IMastraVoiceConfig | null,
  opts: MergeOpts = {},
): VoiceConfig {
  const off = Boolean(opts.globallyDisabled) || stored?.isEnabled === false;

  const sttToken = (stored?.sttToken || '').trim() || env.sttToken;
  const ttsToken = (stored?.ttsToken || '').trim() || env.ttsToken;

  const ttsVoice = (stored?.ttsVoice || '').trim() || env.ttsVoice;
  const storedRate = stored?.ttsSampleRate;
  const ttsSampleRate =
    typeof storedRate === 'number' && CHIMEGE_SAMPLE_RATES.has(storedRate)
      ? storedRate
      : env.ttsSampleRate;

  const sttEnabled = Boolean(sttToken) && !off;
  const ttsEnabled = Boolean(ttsToken) && !off;

  return {
    enabled: sttEnabled && ttsEnabled,
    sttEnabled,
    ttsEnabled,
    sttToken,
    ttsToken,
    ttsVoice,
    ttsSampleRate,
    sttSampleRate: env.sttSampleRate,
    punctuate: env.punctuate,
  };
}

/** Secret-free status derived from the resolved config + the stored sources. */
export function computeVoiceStatusFrom(
  env: VoiceConfig,
  stored: IMastraVoiceConfig | null,
  opts: MergeOpts = {},
): VoiceStatus {
  const merged = mergeVoiceConfig(env, stored, opts);
  const dbStt = Boolean((stored?.sttToken || '').trim());
  const dbTts = Boolean((stored?.ttsToken || '').trim());
  return {
    enabled: merged.enabled,
    sttEnabled: merged.sttEnabled,
    ttsEnabled: merged.ttsEnabled,
    sttSource: dbStt ? 'db' : env.sttToken ? 'env' : 'none',
    ttsSource: dbTts ? 'db' : env.ttsToken ? 'env' : 'none',
    ttsVoice: merged.ttsVoice,
    ttsSampleRate: merged.ttsSampleRate,
    isEnabled: stored?.isEnabled !== false,
  };
}
