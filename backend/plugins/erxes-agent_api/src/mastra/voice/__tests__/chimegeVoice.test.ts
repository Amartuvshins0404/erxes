import { chunkTtsText, concatWav, sanitizeTtsText } from '../chimegeVoice';
import { computeVoiceStatus, resolveVoiceConfig } from '../config';

describe('resolveVoiceConfig', () => {
  const BOTH = { CHIMEGE_STT_TOKEN: 'stt', CHIMEGE_TTS_TOKEN: 'tts' };

  it('is fully disabled with no tokens', () => {
    const cfg = resolveVoiceConfig({});
    expect(cfg.enabled).toBe(false);
    expect(cfg.sttEnabled).toBe(false);
    expect(cfg.ttsEnabled).toBe(false);
    expect(cfg.sttToken).toBe('');
    expect(cfg.ttsToken).toBe('');
  });

  it('gates each direction independently by its own token', () => {
    const sttOnly = resolveVoiceConfig({ CHIMEGE_STT_TOKEN: 'stt' });
    expect(sttOnly.sttEnabled).toBe(true);
    expect(sttOnly.ttsEnabled).toBe(false);
    expect(sttOnly.enabled).toBe(false); // round-trip needs both

    const ttsOnly = resolveVoiceConfig({ CHIMEGE_TTS_TOKEN: 'tts' });
    expect(ttsOnly.ttsEnabled).toBe(true);
    expect(ttsOnly.sttEnabled).toBe(false);
    expect(ttsOnly.enabled).toBe(false);
  });

  it('is fully enabled when both tokens resolve', () => {
    const cfg = resolveVoiceConfig(BOTH);
    expect(cfg.enabled).toBe(true);
    expect(cfg.sttToken).toBe('stt');
    expect(cfg.ttsToken).toBe('tts');
    expect(cfg.ttsVoice).toBe('FEMALE4v2');
    expect(cfg.ttsSampleRate).toBe(22050);
    expect(cfg.sttSampleRate).toBe(16000);
    expect(cfg.punctuate).toBe(true);
  });

  it('stays off when explicitly disabled even with tokens', () => {
    const cfg = resolveVoiceConfig({ ...BOTH, ERXES_AGENT_VOICE: 'disable' });
    expect(cfg.enabled).toBe(false);
    expect(cfg.sttEnabled).toBe(false);
    expect(cfg.ttsEnabled).toBe(false);
  });

  it('honours overrides and rejects an invalid sample rate', () => {
    const cfg = resolveVoiceConfig({
      ...BOTH,
      CHIMEGE_TTS_VOICE: 'MALE2v2',
      CHIMEGE_TTS_SAMPLE_RATE: '9999',
      CHIMEGE_STT_PUNCTUATE: 'false',
    });
    expect(cfg.ttsVoice).toBe('MALE2v2');
    expect(cfg.ttsSampleRate).toBe(22050); // invalid → default
    expect(cfg.punctuate).toBe(false);
  });

  it('computeVoiceStatus leaks no secret', () => {
    expect(computeVoiceStatus(BOTH)).toEqual({ enabled: true });
  });
});

describe('sanitizeTtsText', () => {
  it('strips markdown/code artefacts and collapses whitespace', () => {
    expect(sanitizeTtsText('**Сайн** _байна_   уу?\n`код`')).toBe(
      'Сайн байна уу? код',
    );
  });

  it('drops Latin words and digits so mixed replies stay speakable', () => {
    // "API"/"2026" would otherwise trip Chimege errs 4005/4006 → 502.
    expect(sanitizeTtsText('API 2026 онд гарна.')).toBe('онд гарна.');
  });

  it('lowercases uppercase Cyrillic runs (Chimege err 4006)', () => {
    expect(sanitizeTtsText('ЭРХЭС сайн.')).toBe('эрхэс сайн.');
  });

  it('strips emoji and stray symbols', () => {
    expect(sanitizeTtsText('Сайн 😀 байна')).toBe('Сайн байна');
  });
});

describe('chunkTtsText', () => {
  it('returns a single chunk under the limit', () => {
    expect(chunkTtsText('Сайн байна уу.', 300)).toEqual(['Сайн байна уу.']);
  });

  it('returns nothing for empty text', () => {
    expect(chunkTtsText('   ', 300)).toEqual([]);
  });

  it('splits on sentence boundaries and keeps every chunk within the cap', () => {
    const sentence = 'А'.repeat(40) + '. ';
    const text = sentence.repeat(10); // ~420 chars
    const chunks = chunkTtsText(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(100);
    expect(chunks.join('').replace(/\s/g, '')).toBe(
      text.replace(/\s/g, ''),
    );
  });

  it('hard-splits a single word longer than the cap', () => {
    const chunks = chunkTtsText('Б'.repeat(250), 100);
    expect(chunks.length).toBe(3);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(100);
  });
});

// Build a minimal 16-bit mono PCM WAV with `samples` bytes of payload.
function fakeWav(sampleRate: number, dataBytes: number): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([header, Buffer.alloc(dataBytes, 1)]);
}

describe('concatWav', () => {
  it('stitches PCM payloads under one canonical header', () => {
    const out = concatWav([fakeWav(16000, 100), fakeWav(16000, 60)]);
    expect(out.toString('ascii', 0, 4)).toBe('RIFF');
    expect(out.toString('ascii', 8, 12)).toBe('WAVE');
    expect(out.readUInt32LE(24)).toBe(16000); // sample rate preserved
    expect(out.readUInt32LE(40)).toBe(160); // 100 + 60 data bytes
    expect(out.length).toBe(44 + 160);
  });

  it('returns the single clip unchanged when given one', () => {
    const one = fakeWav(22050, 80);
    expect(concatWav([one])).toBe(one);
  });

  it('throws when there is no audio', () => {
    expect(() => concatWav([])).toThrow();
  });
});
