const mockPersistGeneratedFile = jest.fn();
const mockFileTypeFromBuffer = jest.fn();
const mockStoreWebsiteFiles = jest.fn();

jest.mock('file-type', () => ({
  fileTypeFromBuffer: (...args: unknown[]) => mockFileTypeFromBuffer(...args),
}));
jest.mock('~/mastra/files/persist', () => ({
  persistGeneratedFile: (...args: unknown[]) =>
    mockPersistGeneratedFile(...args),
}));
jest.mock('~/mastra/files/websiteFileStore', () => ({
  storeWebsiteFiles: (...args: unknown[]) => mockStoreWebsiteFiles(...args),
}));
jest.mock('./artifacts', () => {
  const actual = jest.requireActual('./artifacts');
  return { ...actual, newArtifactId: () => 'site_fixed' };
});

import { createHash } from 'node:crypto';
import { publishPreviewWebsite } from './previewPublisher';
import type { IModels } from '~/connectionResolvers';

const models = {} as IModels;

beforeEach(() => {
  jest.clearAllMocks();
  mockStoreWebsiteFiles.mockImplementation(
    async (
      _models: IModels,
      _artifactId: string,
      files: Array<{
        path: string;
        fileName: string;
        buffer: Buffer;
        mimeType: string;
        sha256: string;
      }>,
    ) =>
      files.map((file) => ({
        path: file.path,
        fileKey: `private/site/${file.fileName}`,
        mimeType: file.mimeType,
        size: file.buffer.length,
        sha256: file.sha256,
        inline: false as const,
      })),
  );
});

describe('website preview publisher', () => {
  it('publishes one immutable manifest with per-file content hashes', async () => {
    const html = Buffer.from('<h1>Launch</h1>');
    const css = Buffer.from('body{}');

    const result = await publishPreviewWebsite(models, {
      root: 'dist',
      entryPath: 'index.html',
      title: 'Launch site',
      files: [
        { path: 'index.html', fileName: 'index.html', buffer: html },
        { path: 'assets/site.css', fileName: 'site.css', buffer: css },
      ],
    });

    expect(result.files).toEqual([
      {
        path: 'index.html',
        sha256: createHash('sha256').update(html).digest('hex'),
        fileKey: 'private/site/index.html',
        mimeType: 'text/html; charset=utf-8',
        size: 15,
        inline: false,
      },
      {
        path: 'assets/site.css',
        sha256: createHash('sha256').update(css).digest('hex'),
        fileKey: 'private/site/site.css',
        mimeType: 'text/css; charset=utf-8',
        size: 6,
        inline: false,
      },
    ]);
    expect(result.artifact).toMatchObject({
      id: 'site_fixed',
      kind: 'website',
      title: 'Launch site',
      entryPath: 'index.html',
      fileCount: 2,
      fileName: 'index.html',
      mimeType: 'text/html; charset=utf-8',
      fileKey: 'private/site/index.html',
      size: 21,
    });
    expect(result.artifact.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.artifact.previewToken).toEqual(expect.any(String));
    expect(mockFileTypeFromBuffer).not.toHaveBeenCalled();
  });

  it('rejects a non-HTML entry before uploading files', async () => {
    await expect(
      publishPreviewWebsite(models, {
        root: 'dist',
        entryPath: 'index.txt',
        files: [
          {
            path: 'index.txt',
            fileName: 'index.txt',
            buffer: Buffer.from('text'),
          },
        ],
      }),
    ).rejects.toThrow('Website entry must be an HTML file');
    expect(mockStoreWebsiteFiles).not.toHaveBeenCalled();
  });

  it('fails clearly when tenant website storage is unavailable', async () => {
    mockStoreWebsiteFiles.mockRejectedValueOnce(
      new Error('tenant storage unavailable'),
    );

    await expect(
      publishPreviewWebsite(models, {
        root: 'dist',
        entryPath: 'index.html',
        files: [
          {
            path: 'index.html',
            fileName: 'index.html',
            buffer: Buffer.from('<h1>Site</h1>'),
          },
        ],
      }),
    ).rejects.toThrow('tenant storage unavailable');
  });
});
