import { downsample, encodeWav, mergeChunks } from './wavEncoder';

const ascii = (buf: ArrayBuffer, start: number, end: number): string =>
  String.fromCharCode(...new Uint8Array(buf.slice(start, end)));

describe('mergeChunks', () => {
  it('concatenates Float32 chunks in order', () => {
    const out = mergeChunks([
      new Float32Array([0.1, 0.2]),
      new Float32Array([0.3]),
      new Float32Array([0.4, 0.5]),
    ]);
    expect(Array.from(out).map((n) => +n.toFixed(1))).toEqual([
      0.1, 0.2, 0.3, 0.4, 0.5,
    ]);
  });

  it('returns an empty buffer for no chunks', () => {
    expect(mergeChunks([]).length).toBe(0);
  });
});

describe('downsample', () => {
  it('halves the length when going 32k → 16k', () => {
    const input = new Float32Array(100).fill(0.5);
    const out = downsample(input, 32000, 16000);
    expect(out.length).toBe(50);
    expect(out[0]).toBeCloseTo(0.5);
  });

  it('returns the input untouched when target >= input rate', () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);
    expect(downsample(input, 16000, 16000)).toBe(input);
    expect(downsample(input, 16000, 22050)).toBe(input);
  });
});

describe('encodeWav', () => {
  it('writes a valid 16-bit mono PCM RIFF/WAVE header', () => {
    const samples = new Float32Array([0, 0, 0, 0]); // 4 samples → 8 data bytes
    const buf = encodeWav(samples, 16000);
    const view = new DataView(buf);

    expect(ascii(buf, 0, 4)).toBe('RIFF');
    expect(ascii(buf, 8, 12)).toBe('WAVE');
    expect(ascii(buf, 12, 16)).toBe('fmt ');
    expect(ascii(buf, 36, 40)).toBe('data');

    expect(view.getUint32(16, true)).toBe(16); // fmt chunk size
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16000); // sample rate
    expect(view.getUint32(28, true)).toBe(16000 * 2); // byte rate (mono 16-bit)
    expect(view.getUint16(32, true)).toBe(2); // block align
    expect(view.getUint16(34, true)).toBe(16); // bits per sample

    const dataLen = samples.length * 2;
    expect(view.getUint32(4, true)).toBe(36 + dataLen); // RIFF chunk size
    expect(view.getUint32(40, true)).toBe(dataLen); // data chunk size
    expect(buf.byteLength).toBe(44 + dataLen);
  });

  it('converts Float32 samples to clamped Int16 little-endian', () => {
    const samples = new Float32Array([0, 1, -1, 0.5, 2, -2]);
    const view = new DataView(encodeWav(samples, 16000));
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(32767); // +1 → max
    expect(view.getInt16(48, true)).toBe(-32768); // -1 → min
    expect(view.getInt16(50, true)).toBe(Math.trunc(0.5 * 0x7fff)); // 16383
    expect(view.getInt16(52, true)).toBe(32767); // clamped from +2
    expect(view.getInt16(54, true)).toBe(-32768); // clamped from -2
  });

  it('honours the given sample rate', () => {
    const view = new DataView(encodeWav(new Float32Array([0]), 44100));
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint32(28, true)).toBe(44100 * 2);
  });
});
