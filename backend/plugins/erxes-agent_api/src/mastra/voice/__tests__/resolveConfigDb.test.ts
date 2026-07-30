// Proves the DB-aware wrapper the voice routes call (resolveVoiceConfigForTenant
// / resolveVoiceStatusForTenant) reads the tenant's stored Chimege token and
// resolves it OVER the env fallback. generateModels is mocked so the test never
// loads the real connection graph or touches Mongo.

const getVoiceConfig = jest.fn();

jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn(async () => ({
    MastraVoiceConfig: { getVoiceConfig },
  })),
}));

import {
  resolveVoiceConfigForTenant,
  resolveVoiceStatusForTenant,
} from '../resolveConfig';

// A stored doc as Mongoose returns it — toObject() yields the plain fields.
function storedDoc(fields: Record<string, unknown>) {
  return { toObject: () => fields };
}

describe('resolveVoiceConfigForTenant (DB over env)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    getVoiceConfig.mockReset();
    process.env = { ...ORIGINAL_ENV };
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('uses the tenant DB token over the env token', async () => {
    process.env.CHIMEGE_STT_TOKEN = 'env-stt';
    process.env.CHIMEGE_TTS_TOKEN = 'env-tts';
    getVoiceConfig.mockResolvedValue(
      storedDoc({ sttToken: 'db-stt', ttsToken: 'db-tts', ttsVoice: 'MALE2v2' }),
    );

    const cfg = await resolveVoiceConfigForTenant('acme');
    expect(cfg.sttToken).toBe('db-stt');
    expect(cfg.ttsToken).toBe('db-tts');
    expect(cfg.ttsVoice).toBe('MALE2v2');
    expect(cfg.enabled).toBe(true);
  });

  it('falls back to env when the tenant has stored nothing', async () => {
    process.env.CHIMEGE_STT_TOKEN = 'env-stt';
    process.env.CHIMEGE_TTS_TOKEN = 'env-tts';
    getVoiceConfig.mockResolvedValue(null);

    const cfg = await resolveVoiceConfigForTenant('acme');
    expect(cfg.sttToken).toBe('env-stt');
    expect(cfg.ttsToken).toBe('env-tts');
  });

  it('per-direction gates: DB STT token only, no TTS anywhere → 503-able TTS', async () => {
    delete process.env.CHIMEGE_STT_TOKEN;
    delete process.env.CHIMEGE_TTS_TOKEN;
    getVoiceConfig.mockResolvedValue(storedDoc({ sttToken: 'db-stt' }));

    const cfg = await resolveVoiceConfigForTenant('acme');
    expect(cfg.sttEnabled).toBe(true);
    expect(cfg.ttsEnabled).toBe(false); // route returns 503 for tts
    expect(cfg.enabled).toBe(false);
  });

  it('the deployment kill switch forces both directions off', async () => {
    process.env.CHIMEGE_STT_TOKEN = 'env-stt';
    process.env.CHIMEGE_TTS_TOKEN = 'env-tts';
    process.env.ERXES_AGENT_VOICE = 'disable';
    getVoiceConfig.mockResolvedValue(
      storedDoc({ sttToken: 'db-stt', ttsToken: 'db-tts' }),
    );

    const cfg = await resolveVoiceConfigForTenant('acme');
    expect(cfg.sttEnabled).toBe(false);
    expect(cfg.ttsEnabled).toBe(false);
  });

  it('status is secret-free and reports db as the winning source', async () => {
    process.env.CHIMEGE_STT_TOKEN = 'env-stt';
    process.env.CHIMEGE_TTS_TOKEN = 'env-tts';
    getVoiceConfig.mockResolvedValue(
      storedDoc({ sttToken: 'db-stt', ttsToken: 'db-tts' }),
    );

    const status = await resolveVoiceStatusForTenant('acme');
    expect(status.sttSource).toBe('db');
    expect(status.ttsSource).toBe('db');
    expect(status.enabled).toBe(true);
    expect(JSON.stringify(status)).not.toContain('db-stt');
    expect(JSON.stringify(status)).not.toContain('env-stt');
  });
});
