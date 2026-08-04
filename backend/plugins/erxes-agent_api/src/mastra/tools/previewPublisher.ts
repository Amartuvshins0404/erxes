import { createHash, randomBytes } from 'node:crypto';
import * as path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import { persistGeneratedFile } from '~/mastra/files/persist';
import {
  storeWebsiteFiles,
  type WebsiteFileUpload,
} from '~/mastra/files/websiteFileStore';
import type {
  SandboxPreviewFile,
  SandboxPreviewWebsite,
} from '~/mastra/sandbox/commandService';
import type { IWebsiteFileReference } from '@/artifact/@types/artifact';
import {
  newArtifactId,
  type DocumentArtifact,
  type WebsiteArtifact,
} from './artifacts';

interface UploadedPreviewFile {
  fileKey: string;
  mimeType: string;
  size: number;
  inline: boolean;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  css: 'text/css; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  map: 'application/json; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  svg: 'image/svg+xml',
  txt: 'text/plain; charset=utf-8',
  webmanifest: 'application/manifest+json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
};

const previewMimeType = async (file: SandboxPreviewFile): Promise<string> => {
  const extension = path.extname(file.fileName).slice(1).toLowerCase();
  const mappedMimeType = MIME_BY_EXTENSION[extension];
  const detected = mappedMimeType
    ? undefined
    : await fileTypeFromBuffer(file.buffer);
  return mappedMimeType || detected?.mime || 'application/octet-stream';
};

const persistPreviewFile = async (
  file: SandboxPreviewFile,
): Promise<UploadedPreviewFile> => {
  const mimeType = await previewMimeType(file);
  const persisted = await persistGeneratedFile({
    buffer: file.buffer,
    fileName: file.fileName,
    mimeType,
    allowInlineFallback: false,
  }).catch(() => {
    throw new ExpectedError(
      'Could not persist the generated preview to private file storage.',
    );
  });

  return {
    fileKey: persisted.fileKey,
    mimeType,
    size: persisted.size,
    inline: persisted.inline,
  };
};

const PREVIEW_UPLOAD_CONCURRENCY = 4;

const publishPreviewFile = async (
  file: SandboxPreviewFile,
): Promise<DocumentArtifact> => {
  const uploaded = await persistPreviewFile(file);
  const extension = path.extname(file.fileName).slice(1).toLowerCase();

  return {
    id: newArtifactId('doc'),
    kind: 'document',
    format: extension || uploaded.mimeType,
    title: file.path,
    fileName: file.fileName,
    ...uploaded,
  };
};

export const publishPreviewFiles = async (
  files: SandboxPreviewFile[],
): Promise<DocumentArtifact[]> => {
  const artifacts: DocumentArtifact[] = [];
  for (
    let offset = 0;
    offset < files.length;
    offset += PREVIEW_UPLOAD_CONCURRENCY
  ) {
    const batch = await Promise.all(
      files
        .slice(offset, offset + PREVIEW_UPLOAD_CONCURRENCY)
        .map(publishPreviewFile),
    );
    artifacts.push(...batch);
  }
  return artifacts;
};

const manifestDigest = (files: IWebsiteFileReference[]): string =>
  createHash('sha256')
    .update(
      [...files]
        .sort((left, right) => left.path.localeCompare(right.path))
        .map((file) => `${file.path}\0${file.sha256}`)
        .join('\n'),
    )
    .digest('hex');

export const publishPreviewWebsite = async (
  models: IModels,
  website: SandboxPreviewWebsite,
): Promise<{
  artifact: WebsiteArtifact;
  files: IWebsiteFileReference[];
}> => {
  if (!/\.html?$/i.test(website.entryPath)) {
    throw new ExpectedError(
      'Website entry must be an HTML file inside the published root.',
    );
  }

  const entryFile = website.files.find(
    (file) => file.path === website.entryPath,
  );
  if (!entryFile) {
    throw new ExpectedError(
      'Website entry must be an HTML file inside the published root.',
    );
  }

  const artifactId = newArtifactId('site');
  const filesToStore = await Promise.all(
    website.files.map(
      async (file): Promise<WebsiteFileUpload> => ({
        path: file.path,
        fileName: file.fileName,
        buffer: file.buffer,
        mimeType: await previewMimeType(file),
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
      }),
    ),
  );
  const entryToStore = filesToStore.find(
    (file) => file.path === website.entryPath,
  );
  if (!entryToStore?.mimeType.startsWith('text/html')) {
    throw new ExpectedError(
      'Website entry must be an HTML file inside the published root.',
    );
  }

  const files = await storeWebsiteFiles(models, artifactId, filesToStore);
  const entry = files.find((file) => file.path === website.entryPath);
  if (!entry) {
    throw new ExpectedError(
      'Website entry must be an HTML file inside the published root.',
    );
  }

  const artifact: WebsiteArtifact = {
    id: artifactId,
    kind: 'website',
    title: website.title?.trim() || path.basename(website.root),
    entryPath: website.entryPath,
    fileCount: files.length,
    contentHash: manifestDigest(files),
    previewToken: randomBytes(24).toString('base64url'),
    fileName: path.basename(website.entryPath),
    mimeType: entry.mimeType,
    fileKey: entry.fileKey,
    inline: entry.inline,
    size: files.reduce((total, file) => total + file.size, 0),
  };

  return { artifact, files };
};
