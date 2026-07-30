// Pure, browser-agnostic WAV plumbing for the voice recorder. The mic is
// captured as mono Float32 PCM (Web Audio); these helpers merge the captured
// chunks, optionally decimate to 16kHz, and pack the samples into a 16-bit PCM
// RIFF/WAVE buffer the backend relays straight to Chimege — no ffmpeg, no
// server transcode. Kept side-effect free so it unit-tests in plain Node.

/** Concatenate the Float32 chunks the worklet/processor streamed into one
 *  contiguous buffer. */
export function mergeChunks(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Downsample mono Float32 PCM by simple averaging decimation. Returns the
 *  input unchanged when the target rate is >= the input rate (we never
 *  upsample). Used only as a fallback when the AudioContext can't honour a
 *  16kHz capture rate. */
export function downsample(
  samples: Float32Array,
  inputRate: number,
  targetRate: number,
): Float32Array {
  if (targetRate >= inputRate) return samples;
  const ratio = inputRate / targetRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (
      let i = offsetBuffer;
      i < nextOffsetBuffer && i < samples.length;
      i++
    ) {
      accum += samples[i];
      count += 1;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatTo16BitPCM(
  view: DataView,
  offset: number,
  input: Float32Array,
): void {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    // Asymmetric scale: negatives use the full -32768, positives max at 32767.
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

/** Encode mono Float32 PCM samples into a 16-bit little-endian PCM WAV
 *  (44-byte RIFF/WAVE header + Int16 data) at the given sample rate. */
export function encodeWav(
  samples: Float32Array,
  sampleRate: number,
): ArrayBuffer {
  const bytesPerSample = 2;
  const channels = 1;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // audio format: PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true); // byte rate
  view.setUint16(32, channels * bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  floatTo16BitPCM(view, 44, samples);

  return buffer;
}
