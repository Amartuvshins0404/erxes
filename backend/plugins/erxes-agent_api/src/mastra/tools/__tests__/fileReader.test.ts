import {
  buildResult,
  fileReaderTool,
  nameFromUrl,
  resolveImageMime,
} from '../fileReaderTool';

// toModelOutput is the bridge that makes an image visible to the model — it is
// attached to the created tool. Narrow it to a callable for the tests.
const toModelOutput = (fileReaderTool as unknown as {
  toModelOutput: (out: unknown) => {
    type: string;
    value: unknown;
  };
}).toModelOutput;

describe('nameFromUrl', () => {
  it('takes the last path segment, ignoring the query string', () => {
    expect(nameFromUrl('https://cdn.example.com/a/b/photo.png?x=1')).toBe(
      'photo.png',
    );
    expect(nameFromUrl('https://example.com/files/Report%20Q1.pdf')).toBe(
      'Report Q1.pdf',
    );
  });

  it('falls back to the host when there is no path', () => {
    expect(nameFromUrl('https://example.com')).toBe('example.com');
  });
});

describe('resolveImageMime', () => {
  it('prefers the content-type, normalizing image/jpg', () => {
    expect(resolveImageMime('x', 'image/png')).toBe('image/png');
    expect(resolveImageMime('x', 'image/jpg')).toBe('image/jpeg');
    expect(resolveImageMime('x', 'image/webp; charset=binary')).toBe(
      'image/webp',
    );
  });

  it('falls back to the file extension', () => {
    expect(resolveImageMime('pic.JPEG')).toBe('image/jpeg');
    expect(resolveImageMime('logo.svg')).toBe('image/svg+xml');
    expect(resolveImageMime('noext')).toBe('image/png');
  });
});

describe('file_reader image handling', () => {
  it('passes a small image through and surfaces it to the model as media', async () => {
    const bytes = Buffer.from('fake-png-bytes'); // small → kept as-is
    const result = await buildResult(bytes, 'photo.png', 'image/png');

    expect(result.format).toBe('image');
    expect(result.imageToken).toBeTruthy();
    expect(result.content).toContain('shown to you');

    const out = toModelOutput(result);
    expect(out.type).toBe('content');
    const parts = out.value as Array<{
      type: string;
      data?: string;
      mediaType?: string;
    }>;
    const media = parts.find((p) => p.type === 'media');
    expect(media?.mediaType).toBe('image/png');
    expect(media?.data).toBe(bytes.toString('base64'));
  });

  it('downscales a large image to a small JPEG so it fits the request budget', async () => {
    // A 2000x1500 uncompressed BMP is ~9MB — far over Kimi's 2MB request limit.
    // It must be re-encoded small enough that the provider accepts the request.
    const { Jimp } = await import('jimp');
    const big = await new Jimp({ width: 2000, height: 1500, color: 0x3366ccff })
      .getBuffer('image/bmp');
    expect(big.length).toBeGreaterThan(2 * 1024 * 1024); // genuinely oversized

    const result = await buildResult(big, 'wide.bmp', 'image/bmp');
    expect(result.imageToken).toBeTruthy();

    const out = toModelOutput(result);
    const parts = out.value as Array<{
      type: string;
      data?: string;
      mediaType?: string;
    }>;
    const media = parts.find((p) => p.type === 'media');
    expect(media?.mediaType).toBe('image/jpeg'); // re-encoded
    // base64 must be comfortably under Kimi's 2MB request ceiling
    expect(media?.data?.length ?? 0).toBeLessThan(1_500_000);
  });

  it('hands SVG over as source text (not media)', async () => {
    const svg = Buffer.from('<svg><rect/></svg>');
    const result = await buildResult(svg, 'icon.svg', 'image/svg+xml');

    expect(result.format).toBe('image');
    expect(result.imageToken).toBeUndefined();
    expect(result.content).toContain('<svg>');

    const out = toModelOutput(result);
    expect(out.type).toBe('json');
  });

  it('notes an image too large to shrink and undecodable, never inlining it', async () => {
    // 1MB of noise named .png — over the keep-as-is bound and not a real raster,
    // so it can't be downscaled. Must degrade to a note, not a broken request.
    const junk = Buffer.alloc(1024 * 1024, 7);
    const result = await buildResult(junk, 'broken.png', 'image/png');

    expect(result.format).toBe('image');
    expect(result.imageToken).toBeUndefined();
    expect(result.content).toMatch(/couldn't be prepared|PNG or JPEG/i);

    const out = toModelOutput(result);
    expect(out.type).toBe('json');
    expect(JSON.stringify(out.value)).not.toContain(junk.toString('base64'));
  });
});

describe('file_reader text handling', () => {
  it('extracts text and returns it as json to the model', async () => {
    const result = await buildResult(Buffer.from('hello world'), 'a.txt');
    expect(result.format).toBe('txt');
    expect(result.content).toBe('hello world');
    expect(result.imageToken).toBeUndefined();

    const out = toModelOutput(result);
    expect(out.type).toBe('json');
    expect((out.value as { content: string }).content).toBe('hello world');
  });

  it('rejects unsupported binary types', async () => {
    await expect(
      buildResult(Buffer.from(''), 'archive.zip', 'application/zip'),
    ).rejects.toThrow(/Unsupported/);
  });
});
