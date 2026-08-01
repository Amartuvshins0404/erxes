import { Jimp } from 'jimp';
import { ExpectedError } from 'erxes-api-shared/utils';
import { runWithAuth } from '~/mastra/requestContext';

// ---------------------------------------------------------------------------
// remove-image-background — unit tests with the inference lib, persistence and
// storage fetchers mocked. What must never regress:
//   • result shape: { artifact: { kind:'image', … }, attachment } ready for
//     productsEdit,
//   • SSRF: a full URL passed as `key` is rejected before any fetch,
//   • non-images are refused,
//   • oversized inputs are downscaled BEFORE inference (memory guard),
//   • inline (data:) persistence yields NO attachment (a data: URL must never
//     be written into a product attachment),
//   • the persisted workspace background-removal switch,
//   • inferences are serialized process-wide (one at a time).
// ---------------------------------------------------------------------------

const removeBackgroundMock = jest.fn();
jest.mock('@imgly/background-removal-node', () => ({
  removeBackground: (...args: unknown[]) => removeBackgroundMock(...args),
}));

const persistGeneratedFileMock = jest.fn();
jest.mock('~/mastra/files/persist', () => ({
  persistGeneratedFile: (...args: unknown[]) =>
    persistGeneratedFileMock(...args),
}));

jest.mock('~/mastra/artifactStore', () => ({
  storeArtifact: jest.fn().mockResolvedValue(undefined),
}));

const fetchAttachmentBufferMock = jest.fn();
const fetchRemoteFileMock = jest.fn();
jest.mock('~/mastra/files/storage', () => {
  const actual = jest.requireActual('~/mastra/files/storage');
  return {
    ...actual,
    fetchAttachmentBuffer: (...args: unknown[]) =>
      fetchAttachmentBufferMock(...args),
    fetchRemoteFile: (...args: unknown[]) => fetchRemoteFileMock(...args),
  };
});

jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn().mockResolvedValue({
    MastraSettings: {
      getSettings: jest
        .fn()
        .mockResolvedValue({ erxesApiUrl: 'http://localhost:4000' }),
    },
    MastraArtifact: { getByArtifactId: jest.fn() },
  }),
}));

import {
  removeImageBackgroundTool,
  serialize,
  withDeadline,
} from '../imageTools';

type ToolResult = {
  artifact: {
    id: string;
    kind: string;
    title: string;
    fileName: string;
    mimeType: string;
    fileKey: string;
    inline?: boolean;
    size?: number;
    width?: number;
    height?: number;
  };
  attachment?: { url: string; name: string; type: string; size: number };
};
interface ImageToolExecutor {
  execute(input: Record<string, unknown>): Promise<ToolResult>;
}

// Mastra's generic tool type erases the concrete execute result in tests.
const imageToolExecutor =
  removeImageBackgroundTool as unknown as ImageToolExecutor;


const execute = (
  input: Record<string, unknown>,
  backgroundRemovalEnabled = true,
): Promise<ToolResult> =>
  runWithAuth({ subdomain: 'os', backgroundRemovalEnabled }, () =>
    imageToolExecutor.execute(input),
  );

const png = (width: number, height: number): Promise<Buffer> =>
  new Jimp({ width, height, color: 0x3366ccff }).getBuffer('image/png');

describe('remove-image-background', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    removeBackgroundMock.mockResolvedValue(new Blob([await png(4, 4)]));
    persistGeneratedFileMock.mockResolvedValue({
      fileKey: 'private/agent/photo-nobg.png',
      size: 1234,
      inline: false,
    });
  });

  it('returns an image artifact + a productsEdit-ready attachment', async () => {
    fetchAttachmentBufferMock.mockResolvedValue({
      buffer: await png(8, 8),
      contentType: 'image/png',
    });

    const result = await execute({ key: 'uploads/photo.png', title: 'Red mug' });

    expect(result.artifact).toMatchObject({
      kind: 'image',
      title: 'Red mug',
      fileName: 'red-mug-nobg.png',
      mimeType: 'image/png',
      fileKey: 'private/agent/photo-nobg.png',
      inline: false,
      size: 1234,
    });
    expect(result.artifact.id).toMatch(/^img_/);
    expect(result.artifact.width).toBe(4);
    expect(result.artifact.height).toBe(4);
    expect(result.attachment).toEqual({
      url: 'private/agent/photo-nobg.png',
      name: 'red-mug-nobg.png',
      type: 'image/png',
      size: 1234,
    });
    // The persisted buffer is the PNG the inference returned.
    expect(persistGeneratedFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'red-mug-nobg.png',
        mimeType: 'image/png',
      }),
    );
  });

  it('rejects a full URL passed as `key` before any fetch (SSRF regression)', async () => {
    await expect(
      execute({ key: 'http://169.254.169.254/latest/meta-data' }),
    ).rejects.toThrow(/must be a storage key/);
    expect(fetchAttachmentBufferMock).not.toHaveBeenCalled();
    expect(removeBackgroundMock).not.toHaveBeenCalled();
  });

  it('refuses non-image files', async () => {
    fetchAttachmentBufferMock.mockResolvedValue({
      buffer: Buffer.from('%PDF-1.4 …'),
      contentType: 'application/pdf',
    });
    await expect(execute({ key: 'uploads/report.pdf' })).rejects.toThrow(
      /not an image/,
    );
    expect(removeBackgroundMock).not.toHaveBeenCalled();
  });

  it('refuses SVG (vector, nothing to segment)', async () => {
    fetchRemoteFileMock.mockResolvedValue({
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      contentType: 'image/svg+xml',
    });
    await expect(
      execute({ url: 'https://example.com/logo.svg' }),
    ).rejects.toThrow(/SVG/);
    expect(removeBackgroundMock).not.toHaveBeenCalled();
  });

  it('downscales oversized inputs before inference (memory guard)', async () => {
    fetchAttachmentBufferMock.mockResolvedValue({
      buffer: await png(2400, 1200),
      contentType: 'image/png',
    });

    await execute({ key: 'uploads/huge.png' });

    // The lib requires a TYPED Blob (a raw Uint8Array becomes a typeless Blob
    // that its imageDecode rejects) — octet-stream defers to sharp's sniffing.
    const input = removeBackgroundMock.mock.calls[0][0] as Blob;
    expect(input).toBeInstanceOf(Blob);
    expect(input.type).toBe('application/octet-stream');
    const decoded = await Jimp.read(Buffer.from(await input.arrayBuffer()));
    expect(Math.max(decoded.width, decoded.height)).toBeLessThanOrEqual(1600);
    // Aspect ratio preserved.
    expect(decoded.width / decoded.height).toBeCloseTo(2, 1);
  });

  it('omits `attachment` when persistence fell back to an inline data: URL', async () => {
    fetchAttachmentBufferMock.mockResolvedValue({
      buffer: await png(8, 8),
      contentType: 'image/png',
    });
    persistGeneratedFileMock.mockResolvedValue({
      fileKey: 'data:image/png;base64,AAAA',
      size: 99,
      inline: true,
    });

    const result = await execute({ key: 'uploads/photo.png' });

    expect(result.artifact.inline).toBe(true);
    expect(result.attachment).toBeUndefined();
  });

  it('is disabled by the persisted workspace setting', async () => {
    await expect(
      execute({ key: 'uploads/photo.png' }, false),
    ).rejects.toThrow(ExpectedError);
    expect(removeBackgroundMock).not.toHaveBeenCalled();
  });

  it('holds the mutex slot past a timeout until the inference settles', async () => {
    // Regression: chaining the slot on the deadline-RACED promise released it
    // the moment the timeout fired while the un-abortable inference kept
    // running — letting the next request stack a second >1GB inference.
    let release!: (v: string) => void;
    const inference = new Promise<string>((res) => {
      release = res;
    });

    const first = serialize(() => ({
      result: withDeadline(inference, 10),
      hold: inference.catch(() => undefined),
    }));
    await expect(first).rejects.toThrow(/timed out/);

    // The timed-out inference is still running — the next task must wait.
    let secondStarted = false;
    const second = serialize(() => {
      secondStarted = true;
      return { result: Promise.resolve('ok'), hold: Promise.resolve() };
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(secondStarted).toBe(false);

    release('done');
    await expect(second).resolves.toBe('ok');
    expect(secondStarted).toBe(true);
  });

  it('serializes inferences process-wide (never two at once)', async () => {
    fetchAttachmentBufferMock.mockResolvedValue({
      buffer: await png(8, 8),
      contentType: 'image/png',
    });

    let active = 0;
    let maxActive = 0;
    const out = new Blob([await png(4, 4)]);
    removeBackgroundMock.mockImplementation(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 20));
      active--;
      return out;
    });

    await Promise.all([
      execute({ key: 'uploads/a.png' }),
      execute({ key: 'uploads/b.png' }),
      execute({ key: 'uploads/c.png' }),
    ]);

    expect(removeBackgroundMock).toHaveBeenCalledTimes(3);
    expect(maxActive).toBe(1);
  });
});
