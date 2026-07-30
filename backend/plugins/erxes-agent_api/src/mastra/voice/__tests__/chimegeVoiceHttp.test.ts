// HTTP-layer tests for the Chimege client. The WAV is now encoded in the
// browser, so STT relays the body straight through — no ffmpeg, no transcode.
// global.fetch is mocked so we exercise the size guard, the WAV sanity helper,
// and the failure→ExpectedError mapping without touching the network.
import {
  isLikelyWav,
  MAX_WAV_BYTES,
  synthesize,
  transcribe,
} from '../chimegeVoice';

// A minimal valid 16-bit mono PCM WAV with `dataBytes` of payload.
function wav(dataBytes = 64): Buffer {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + dataBytes, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.write('data', 36);
  h.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([h, Buffer.alloc(dataBytes, 1)]);
}

function fakeResponse(opts: {
  ok: boolean;
  status: number;
  errorCode?: string;
  body?: string;
  bytes?: Buffer;
}) {
  return {
    ok: opts.ok,
    status: opts.status,
    headers: {
      get: (k: string) =>
        k === 'Error-Code' ? (opts.errorCode ?? null) : null,
    },
    text: async () => opts.body ?? '',
    arrayBuffer: async () => (opts.bytes ?? Buffer.alloc(0)).buffer.slice(0),
  } as unknown as Response;
}

describe('isLikelyWav', () => {
  it('accepts a RIFF/WAVE header of sufficient length', () => {
    expect(isLikelyWav(wav())).toBe(true);
  });

  it('rejects non-WAV junk and too-short buffers', () => {
    expect(isLikelyWav(Buffer.from('this is not audio'))).toBe(false);
    expect(isLikelyWav(Buffer.alloc(10))).toBe(false);
  });
});

describe('transcribe (HTTP)', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('rejects an over-bound WAV before calling the API', async () => {
    const tooBig = Buffer.alloc(MAX_WAV_BYTES + 1);
    await expect(
      transcribe({ token: 't', audio: tooBig }),
    ).rejects.toThrow(/too long/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('relays the WAV body verbatim to Chimege', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ ok: true, status: 200, body: 'сайн' }),
    );
    await transcribe({ token: 't', audio: wav() });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/transcribe$/);
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/octet-stream',
    );
    // The body is the uploaded WAV — no transcode in between.
    expect((init.body as Uint8Array).byteLength).toBe(wav().length);
  });

  it('maps a non-ok response to an ExpectedError with status + Error-Code', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 403,
        errorCode: '1000',
        body: 'invalid token',
      }),
    );
    await expect(
      transcribe({ token: 'bad', audio: wav() }),
    ).rejects.toThrow(/Transcription failed \(403, code 1000\)/);
  });

  it('returns the trimmed transcript on success', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ ok: true, status: 200, body: '  сайн байна  ' }),
    );
    await expect(
      transcribe({ token: 't', audio: wav() }),
    ).resolves.toBe('сайн байна');
  });
});

describe('synthesize (HTTP)', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('maps a non-ok response to an ExpectedError with status + Error-Code', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ ok: false, status: 400, errorCode: '4002', body: 'too long' }),
    );
    await expect(
      synthesize({ token: 't', voice: 'FEMALE3v2', text: 'тест' }),
    ).rejects.toThrow(/Speech synthesis failed \(400, code 4002\)/);
  });

  it('throws when there is no speakable text', async () => {
    await expect(
      synthesize({ token: 't', voice: 'FEMALE3v2', text: '12345 ***' }),
    ).rejects.toThrow(/No speakable text/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
