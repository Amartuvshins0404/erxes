import { resolveVoiceConfig } from '../config';
import { computeVoiceStatusFrom, mergeVoiceConfig } from '../mergeConfig';
import { IMastraVoiceConfig } from '@/voice/@types/voice';

// Env-derived baselines built through the real pure helper so the tests
// exercise the same VoiceConfig shape the routes see.
const envBoth = resolveVoiceConfig({
  CHIMEGE_STT_TOKEN: 'env-stt',
  CHIMEGE_TTS_TOKEN: 'env-tts',
});
const envNone = resolveVoiceConfig({});
const envSttOnly = resolveVoiceConfig({ CHIMEGE_STT_TOKEN: 'env-stt' });

describe('mergeVoiceConfig — DB over env precedence', () => {
  it('falls back entirely to env when nothing is stored', () => {
    const cfg = mergeVoiceConfig(envBoth, null);
    expect(cfg.sttToken).toBe('env-stt');
    expect(cfg.ttsToken).toBe('env-tts');
    expect(cfg.sttEnabled).toBe(true);
    expect(cfg.ttsEnabled).toBe(true);
    expect(cfg.enabled).toBe(true);
  });

  it('lets a tenant DB token win over the env token', () => {
    const stored: IMastraVoiceConfig = {
      sttToken: 'db-stt',
      ttsToken: 'db-tts',
    };
    const cfg = mergeVoiceConfig(envBoth, stored);
    expect(cfg.sttToken).toBe('db-stt');
    expect(cfg.ttsToken).toBe('db-tts');
  });

  it('uses a DB token even when env supplies none (BYOK with no env)', () => {
    const stored: IMastraVoiceConfig = {
      sttToken: 'db-stt',
      ttsToken: 'db-tts',
    };
    const cfg = mergeVoiceConfig(envNone, stored);
    expect(cfg.sttToken).toBe('db-stt');
    expect(cfg.ttsToken).toBe('db-tts');
    expect(cfg.enabled).toBe(true);
  });

  it('gates each direction independently (DB STT + env TTS fallback)', () => {
    const stored: IMastraVoiceConfig = { sttToken: 'db-stt' };
    const cfg = mergeVoiceConfig(envSttOnly, stored);
    expect(cfg.sttToken).toBe('db-stt'); // DB wins
    expect(cfg.sttEnabled).toBe(true);
    expect(cfg.ttsToken).toBe(''); // neither DB nor env has a TTS token
    expect(cfg.ttsEnabled).toBe(false);
    expect(cfg.enabled).toBe(false); // round-trip needs both
  });

  it('treats an empty stored token as unset (falls back to env)', () => {
    const stored: IMastraVoiceConfig = { sttToken: '  ', ttsToken: '' };
    const cfg = mergeVoiceConfig(envBoth, stored);
    expect(cfg.sttToken).toBe('env-stt');
    expect(cfg.ttsToken).toBe('env-tts');
  });
});

describe('mergeVoiceConfig — voice + sample rate precedence', () => {
  it('prefers the stored voice over the env voice', () => {
    const stored: IMastraVoiceConfig = { ttsVoice: 'MALE2v2' };
    expect(mergeVoiceConfig(envBoth, stored).ttsVoice).toBe('MALE2v2');
  });

  it('keeps the env voice when the stored voice is blank', () => {
    const cfg = mergeVoiceConfig(envBoth, { ttsVoice: '' });
    expect(cfg.ttsVoice).toBe(envBoth.ttsVoice);
  });

  it('prefers a valid stored sample rate, ignoring invalid ones', () => {
    expect(mergeVoiceConfig(envBoth, { ttsSampleRate: 16000 }).ttsSampleRate).toBe(
      16000,
    );
    expect(mergeVoiceConfig(envBoth, { ttsSampleRate: 12345 }).ttsSampleRate).toBe(
      envBoth.ttsSampleRate,
    );
  });
});

describe('mergeVoiceConfig — disable gating', () => {
  it('forces both directions off when the tenant switch is off', () => {
    const stored: IMastraVoiceConfig = {
      sttToken: 'db-stt',
      ttsToken: 'db-tts',
      isEnabled: false,
    };
    const cfg = mergeVoiceConfig(envBoth, stored);
    expect(cfg.sttEnabled).toBe(false);
    expect(cfg.ttsEnabled).toBe(false);
    expect(cfg.enabled).toBe(false);
  });

  it('forces both directions off under the deployment kill switch', () => {
    const cfg = mergeVoiceConfig(
      envBoth,
      { sttToken: 'db-stt', ttsToken: 'db-tts' },
      { globallyDisabled: true },
    );
    expect(cfg.sttEnabled).toBe(false);
    expect(cfg.ttsEnabled).toBe(false);
  });
});

describe('computeVoiceStatusFrom — secret-free status', () => {
  it('reports db/env/none sources per direction and never a token', () => {
    const status = computeVoiceStatusFrom(envSttOnly, { ttsToken: 'db-tts' });
    expect(status.sttSource).toBe('env'); // env STT, no DB STT
    expect(status.ttsSource).toBe('db'); // DB TTS wins
    expect(status.enabled).toBe(true);
    expect(JSON.stringify(status)).not.toContain('env-stt');
    expect(JSON.stringify(status)).not.toContain('db-tts');
  });

  it('reports none when neither DB nor env supplies a direction', () => {
    const status = computeVoiceStatusFrom(envNone, null);
    expect(status.sttSource).toBe('none');
    expect(status.ttsSource).toBe('none');
    expect(status.enabled).toBe(false);
  });

  it('reflects the tenant master switch in isEnabled', () => {
    expect(computeVoiceStatusFrom(envBoth, { isEnabled: false }).isEnabled).toBe(
      false,
    );
    expect(computeVoiceStatusFrom(envBoth, null).isEnabled).toBe(true);
  });
});
