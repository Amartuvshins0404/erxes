// ---------------------------------------------------------------------------
// Voice (speech-to-text + text-to-speech) configuration. Pure + injectable:
// every helper takes an `env` map so the resolution logic is unit-testable
// without touching the real environment. Nothing here performs I/O.
//
// The voice feature is powered by Chimege (chimege.com — Mongolian speech AI).
// Chimege issues SEPARATE tokens per direction, so STT and TTS are gated
// independently:
//   • STT is usable when CHIMEGE_STT_TOKEN resolves.
//   • TTS is usable when CHIMEGE_TTS_TOKEN resolves.
// A global ERXES_AGENT_VOICE=disable turns both off. Each route returns a
// disabled-safe 503 when its own token is missing; the UI entry point shows
// only when BOTH directions are usable (a voice conversation is round-trip).
//
// Note: this is separate from OPENAI_API_KEY, which the memory embedder may
// still use — do not fold the two together.
// ---------------------------------------------------------------------------

import { Env, val } from '~/mastra/configEnv';

// Chimege's default voice. FEMALE4v2 is a newest-generation natural female voice
// that reads conversational replies smoothly. Other ids: FEMALE1, FEMALE1v2,
// FEMALE2v2, FEMALE3v2, FEMALE5v2, MALE1, MALE1v2, MALE2v2, MALE3v2, MALE4v2.
// Override per-deployment with CHIMEGE_TTS_VOICE.
const DEFAULT_TTS_VOICE = 'FEMALE4v2';
// Chimege accepts 8000 | 16000 | 22050. 22050 is the highest-fidelity default.
const DEFAULT_TTS_SAMPLE_RATE = 22050;
const VALID_TTS_SAMPLE_RATES = new Set([8000, 16000, 22050]);
// STT upload sample rate (mono PCM WAV). 16kHz is plenty for speech.
const DEFAULT_STT_SAMPLE_RATE = 16000;

export interface VoiceConfig {
  // True when both directions are usable — drives the UI entry point.
  enabled: boolean;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  sttToken: string;
  ttsToken: string;
  ttsVoice: string;
  ttsSampleRate: number;
  sttSampleRate: number;
  punctuate: boolean;
}

/** The Chimege speech-to-text token. Empty string when unset. */
export function resolveSttToken(env: Env): string {
  return val(env, 'CHIMEGE_STT_TOKEN');
}

/** The Chimege text-to-speech token. Empty string when unset. */
export function resolveTtsToken(env: Env): string {
  return val(env, 'CHIMEGE_TTS_TOKEN');
}

function resolveTtsSampleRate(env: Env): number {
  const raw = parseInt(val(env, 'CHIMEGE_TTS_SAMPLE_RATE'), 10);
  return VALID_TTS_SAMPLE_RATES.has(raw) ? raw : DEFAULT_TTS_SAMPLE_RATE;
}

/**
 * Resolve the full voice configuration from env. Each direction is enabled when
 * its token resolves AND the feature is not turned off with
 * ERXES_AGENT_VOICE=disable.
 */
export function resolveVoiceConfig(env: Env): VoiceConfig {
  const sttToken = resolveSttToken(env);
  const ttsToken = resolveTtsToken(env);
  const disabled = val(env, 'ERXES_AGENT_VOICE') === 'disable';
  const sttEnabled = Boolean(sttToken) && !disabled;
  const ttsEnabled = Boolean(ttsToken) && !disabled;
  return {
    enabled: sttEnabled && ttsEnabled,
    sttEnabled,
    ttsEnabled,
    sttToken,
    ttsToken,
    ttsVoice: val(env, 'CHIMEGE_TTS_VOICE') || DEFAULT_TTS_VOICE,
    ttsSampleRate: resolveTtsSampleRate(env),
    sttSampleRate: DEFAULT_STT_SAMPLE_RATE,
    // Auto-punctuation on by default; set CHIMEGE_STT_PUNCTUATE=false to disable.
    punctuate: val(env, 'CHIMEGE_STT_PUNCTUATE') !== 'false',
  };
}

/** Lightweight, secret-free status for the chat UI — decides whether the voice
 *  mode entry point shows (needs both directions). */
export function computeVoiceStatus(env: Env): { enabled: boolean } {
  return { enabled: resolveVoiceConfig(env).enabled };
}
