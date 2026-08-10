import JSZip from 'jszip';
import { fetchAttachmentBuffer } from '../storage';
import {
  extractFileText,
  MAX_PPTX_DECOMPRESSED_BYTES,
  MAX_PPTX_SLIDES,
} from '../extract';

describe('fetchAttachmentBuffer — key is a storage key, never a URL (finding A)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('refuses a full URL passed as a key and never performs an outbound fetch', async () => {
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;

    await expect(
      fetchAttachmentBuffer({
        erxesApiUrl: 'http://core:4000',
        key: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        name: 'evil',
      }),
    ).rejects.toThrow(/not a storage key/i);

    expect(spy).not.toHaveBeenCalled();
  });

  it("reads a real storage key through core's internal /read-file endpoint", async () => {
    const spy = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
      async () =>
        ({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/plain' }),
          arrayBuffer: async () => new TextEncoder().encode('data').buffer,
        } as Response),
    );
    global.fetch = spy as unknown as typeof fetch;

    const { buffer } = await fetchAttachmentBuffer({
      erxesApiUrl: 'http://core:4000',
      key: 'uploads/abc.txt',
      name: 'abc.txt',
    });

    expect(buffer.toString()).toBe('data');
    const calledUrl = String(spy.mock.calls[0][0]);
    expect(calledUrl).toBe(
      'http://core:4000/read-file?key=uploads%2Fabc.txt&inline=true',
    );
  });
});

describe('extractPptx — decompression-bomb guard (finding D)', () => {
  it('extracts a normal deck', async () => {
    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', '<a:t>Hello</a:t><a:t>World</a:t>');
    zip.file('ppt/slides/slide2.xml', '<a:t>Second</a:t>');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    const out = await extractFileText({ buffer, name: 'deck.pptx' });
    expect(out.format).toBe('pptx');
    expect(out.content).toContain('--- Slide 1 ---');
    expect(out.content).toContain('Hello World');
    expect(out.content).toContain('Second');
  });

  it('bails on a zip bomb (small archive, huge declared uncompressed size)', async () => {
    const huge = 'A'.repeat(MAX_PPTX_DECOMPRESSED_BYTES + 1024);
    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', `<a:t>${huge}</a:t>`);
    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // The ~50MB payload compresses to a tiny archive — a classic bomb.
    expect(buffer.length).toBeLessThan(1 * 1024 * 1024);
    await expect(
      extractFileText({ buffer, name: 'bomb.pptx' }),
    ).rejects.toThrow(/decompression limit/i);
  });

  it('bails when slide count exceeds the cap', async () => {
    const zip = new JSZip();
    for (let i = 1; i <= MAX_PPTX_SLIDES + 1; i++) {
      zip.file(`ppt/slides/slide${i}.xml`, '<a:t>x</a:t>');
    }
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(
      extractFileText({ buffer, name: 'many.pptx' }),
    ).rejects.toThrow(/too many slides/i);
  });
});
