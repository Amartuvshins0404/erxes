// ---------------------------------------------------------------------------
// Thin Chimege (chimege.com — Mongolian speech AI) client used by the voice
// routes. Two operations, both server-side so the token never reaches the
// browser:
//   transcribe() → POST /transcribe  (octet-stream WAV in, text/plain out)
//   synthesize() → POST /synthesize  (text/plain in, audio/x-wav out)
//
// Auth is the `token` header. Node 18+ globals (fetch) are used directly — no
// SDK or new dependency. Failures surface as ExpectedError so the routes
// translate them into a clean 4xx/5xx instead of a stack trace.
//
// No ffmpeg / server-side transcode: the browser captures raw PCM and encodes
// the WAV itself, so STT just relays the uploaded WAV straight to Chimege. TTS
// caps a request at 300 normalised chars, so long text is chunked and the
// per-chunk WAV results are stitched here (concatWav).
// ---------------------------------------------------------------------------

import { ExpectedError } from 'erxes-api-shared/utils';

const CHIMEGE_API_BASE = 'https://api.chimege.com/v1.2';
// Chimege rejects STT uploads over 3MB. At 16kHz mono 16-bit that is ~95s of
// audio — ample for push-to-talk. The client encodes the WAV, but we never
// trust it: the route enforces this bound before forwarding.
export const MAX_WAV_BYTES = 3 * 1024 * 1024;
// Chimege caps one /synthesize request at 300 normalised characters (err 4002).
const MAX_TTS_CHUNK_CHARS = 300;

/** Cheap RIFF/WAVE sanity check on an uploaded body — enough to reject obvious
 *  non-WAV junk before forwarding it to Chimege, without decoding the stream. */
export function isLikelyWav(buf: Buffer): boolean {
  return (
    buf.length >= 44 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WAVE'
  );
}

export interface TranscribeParams {
  token: string;
  // The body is ALREADY a 16-bit PCM WAV (encoded in the browser) — relayed
  // verbatim to Chimege, no transcode.
  audio: Buffer;
  // Auto-punctuate the transcript (nicer text for the chat input).
  punctuate?: boolean;
}

/** Transcribe recorded Mongolian speech to text via Chimege STT. The body is
 *  already a browser-encoded WAV, relayed straight to Chimege. Returns the
 *  trimmed transcript (empty string when the model heard nothing). */
export async function transcribe(params: TranscribeParams): Promise<string> {
  const { token, audio, punctuate = true } = params;

  // Safety net behind the route's own guard: never forward an over-cap body.
  if (audio.length > MAX_WAV_BYTES) {
    throw new ExpectedError(
      'Recording is too long. Please keep it under ~90 seconds.',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${CHIMEGE_API_BASE}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        token,
        Punctuate: String(punctuate),
      },
      body: new Uint8Array(audio),
    });
  } catch (err) {
    throw new ExpectedError(
      `Could not reach the transcription service: ${(err as Error).message}`,
    );
  }

  if (!response.ok) {
    throw new ExpectedError(await describeFailure(response, 'Transcription'));
  }

  // Chimege returns the transcript as a plain-text body, not JSON.
  const text = await response.text().catch(() => '');
  return text.trim();
}

export interface SynthesizeParams {
  token: string;
  voice: string;
  text: string;
  // 8000 | 16000 | 22050 (Chimege's allowed rates).
  sampleRate?: number;
  speed?: number;
  pitch?: number;
}

export interface SynthesizedSpeech {
  audio: Buffer;
  contentType: string;
}

/** Synthesize text to speech via Chimege TTS. Long text is split into ≤300-char
 *  chunks and the per-chunk WAVs are stitched into one clip. Returns the audio
 *  bytes plus the matching Content-Type for the HTTP response. */
export async function synthesize(
  params: SynthesizeParams,
): Promise<SynthesizedSpeech> {
  const chunks = chunkTtsText(sanitizeTtsText(params.text), MAX_TTS_CHUNK_CHARS);
  if (chunks.length === 0) {
    throw new ExpectedError('No speakable text.');
  }

  const audios: Buffer[] = [];
  for (const chunk of chunks) {
    audios.push(await synthesizeChunk({ ...params, text: chunk }));
  }

  return { audio: concatWav(audios), contentType: 'audio/wav' };
}

// One ≤300-char chunk → WAV bytes. Splitting/stitching is handled by the caller.
async function synthesizeChunk(params: SynthesizeParams): Promise<Buffer> {
  const { token, voice, text, sampleRate = 22050, speed, pitch } = params;

  const headers: Record<string, string> = {
    'Content-Type': 'text/plain',
    token,
    'voice-id': voice,
    'sample-rate': String(sampleRate),
  };
  if (typeof speed === 'number') headers['speed'] = String(speed);
  if (typeof pitch === 'number') headers['pitch'] = String(pitch);

  let response: Response;
  try {
    response = await fetch(`${CHIMEGE_API_BASE}/synthesize`, {
      method: 'POST',
      headers,
      body: text,
    });
  } catch (err) {
    throw new ExpectedError(
      `Could not reach the speech service: ${(err as Error).message}`,
    );
  }

  if (!response.ok) {
    throw new ExpectedError(await describeFailure(response, 'Speech synthesis'));
  }

  return Buffer.from(await response.arrayBuffer());
}

// Build an ExpectedError message from a failed Chimege response, surfacing the
// `Error-Code` header (1xxx token, 2xxx audio, 4xxx text) when present.
async function describeFailure(
  response: Response,
  label: string,
): Promise<string> {
  const code = response.headers.get('Error-Code') ?? '';
  const detail = (await response.text().catch(() => '')).slice(0, 300);
  const codePart = code ? `, code ${code}` : '';
  return `${label} failed (${response.status}${codePart}). ${detail}`.trim();
}

// Coerce an arbitrary agent reply into Chimege's speakable character set
// (Cyrillic + spaces + a small punctuation set). Chimege errors 4005 on other
// characters and 4006 on runs of uppercase, so a mixed-language reply
// ("API", "2026", product names) would otherwise 502. We degrade gracefully:
// drop markdown, Latin, and digits, keep only allowed chars, and lowercase
// uppercase runs. Exported for unit testing.
// TODO: transliterate digits and common Latin terms to Mongolian words instead
// of dropping them, for a more natural read.
export function sanitizeTtsText(text: string): string {
  const cleaned = text
    // markdown / code artefacts
    .replace(/[*_`#>|~^=+[\]{}()<>\\/@]/g, ' ')
    // digits (dropped for now — see TODO)
    .replace(/\d+/g, ' ')
    // Latin letters (Chimege speaks Cyrillic only)
    .replace(/[A-Za-z]+/g, ' ')
    // anything else outside Cyrillic + allowed punctuation (emoji, symbols…)
    .replace(/[^Ѐ-ӿ\s.,?!:'"-]/g, ' ')
    // break runs of uppercase (Chimege err 4006) by lowercasing them
    .replace(/\p{Lu}{2,}/gu, (run) => run.toLowerCase());
  return cleaned.replace(/\s+/g, ' ').trim();
}

// Split text into ≤max-char chunks, preferring sentence then word boundaries.
// Exported for unit testing.
export function chunkTtsText(text: string, max: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= max) return [trimmed];

  const sentences = trimmed.match(/[^.?!]+[.?!]*\s*/g) ?? [trimmed];
  const out: string[] = [];
  let buf = '';
  for (const sentence of sentences) {
    if (sentence.length > max) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      out.push(...splitByWords(sentence, max));
      continue;
    }
    if ((buf + sentence).length > max) {
      if (buf.trim()) out.push(buf.trim());
      buf = sentence;
    } else {
      buf += sentence;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function splitByWords(segment: string, max: number): string[] {
  const out: string[] = [];
  let buf = '';
  for (const word of segment.split(/\s+/).filter(Boolean)) {
    const candidate = buf ? `${buf} ${word}` : word;
    if (candidate.length > max) {
      if (buf) out.push(buf);
      if (word.length > max) {
        for (let i = 0; i < word.length; i += max) {
          out.push(word.slice(i, i + max));
        }
        buf = '';
      } else {
        buf = word;
      }
    } else {
      buf = candidate;
    }
  }
  if (buf) out.push(buf);
  return out;
}

// ─── WAV stitching (TTS) ─────────────────────────────────────────────────────
// Chimege TTS caps a request at 300 normalised chars, so a long reply is
// synthesised in chunks. Each chunk comes back as its own WAV; concatWav
// stitches the PCM payloads under one canonical header so the client plays a
// single continuous clip. (This is pure buffer work — no ffmpeg, no transcode.)

// Locate a RIFF subchunk by 4-char id, returning the byte range of its body.
function findChunk(
  buf: Buffer,
  id: string,
): { offset: number; size: number } | null {
  let off = 12; // skip "RIFF"<size>"WAVE"
  while (off + 8 <= buf.length) {
    const cid = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (cid === id) return { offset: off + 8, size };
    off += 8 + size + (size % 2); // chunks are word-aligned
  }
  return null;
}

function buildWavHeader(
  dataLen: number,
  fmt: { channels: number; sampleRate: number; bitsPerSample: number },
): Buffer {
  const { channels, sampleRate, bitsPerSample } = fmt;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);
  return header;
}

/** Stitch multiple PCM-WAV buffers (same format) into one clip. Reads the
 *  format from the first part and concatenates every `data` payload under a
 *  single canonical 44-byte header. */
export function concatWav(parts: Buffer[]): Buffer {
  const valid = parts.filter((p) => p && p.length > 44);
  if (valid.length === 0) {
    throw new ExpectedError('No audio was produced.');
  }
  if (valid.length === 1) return valid[0];

  const first = valid[0];
  const fmt = findChunk(first, 'fmt ');
  if (!fmt) return first; // unparseable header — return the first clip as-is
  const channels = first.readUInt16LE(fmt.offset + 2);
  const sampleRate = first.readUInt32LE(fmt.offset + 4);
  const bitsPerSample = first.readUInt16LE(fmt.offset + 14);

  const datas = valid.map((p) => {
    const d = findChunk(p, 'data');
    return d ? p.subarray(d.offset, d.offset + d.size) : Buffer.alloc(0);
  });
  const pcm = Buffer.concat(datas);
  return Buffer.concat([
    buildWavHeader(pcm.length, { channels, sampleRate, bitsPerSample }),
    pcm,
  ]);
}
