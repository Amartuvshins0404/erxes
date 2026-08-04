import { once } from 'node:events';
import type { Readable } from 'node:stream';
import mongoose from 'mongoose';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';

const WEBSITE_BUCKET = 'mastraWebsiteFiles';
const WEBSITE_FILE_KEY_PREFIX = 'mastra-website:';
const WEBSITE_UPLOAD_CONCURRENCY = 4;

export interface WebsiteFileUpload {
  path: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  sha256: string;
}

export interface StoredWebsiteFile {
  path: string;
  fileKey: string;
  mimeType: string;
  size: number;
  sha256: string;
  inline: false;
}

const websiteBucket = async (
  models: IModels,
): Promise<mongoose.mongo.GridFSBucket> => {
  const connection = models.MastraArtifact.db;
  if (!connection.db) await connection.asPromise();
  if (!connection.db) {
    throw new ExpectedError('Website file storage is unavailable.');
  }
  return new mongoose.mongo.GridFSBucket(connection.db, {
    bucketName: WEBSITE_BUCKET,
  });
};

const fileObjectId = (fileKey: string): mongoose.mongo.ObjectId => {
  if (!fileKey.startsWith(WEBSITE_FILE_KEY_PREFIX)) {
    throw new ExpectedError('Website file reference is invalid.');
  }
  const value = fileKey.slice(WEBSITE_FILE_KEY_PREFIX.length);
  if (!mongoose.mongo.ObjectId.isValid(value)) {
    throw new ExpectedError('Website file reference is invalid.');
  }
  return new mongoose.mongo.ObjectId(value);
};

const uploadWebsiteFile = async (
  bucket: mongoose.mongo.GridFSBucket,
  artifactId: string,
  file: WebsiteFileUpload,
): Promise<StoredWebsiteFile> => {
  const stream = bucket.openUploadStream(file.fileName, {
    contentType: file.mimeType,
    metadata: {
      artifactId,
      path: file.path,
      sha256: file.sha256,
    },
  });
  const finished = once(stream, 'finish');
  stream.end(file.buffer);
  await finished;

  return {
    path: file.path,
    fileKey: `${WEBSITE_FILE_KEY_PREFIX}${stream.id.toHexString()}`,
    mimeType: file.mimeType,
    size: file.buffer.length,
    sha256: file.sha256,
    inline: false,
  };
};

export const storeWebsiteFiles = async (
  models: IModels,
  artifactId: string,
  files: WebsiteFileUpload[],
): Promise<StoredWebsiteFile[]> => {
  const bucket = await websiteBucket(models);
  const stored: StoredWebsiteFile[] = [];
  for (
    let offset = 0;
    offset < files.length;
    offset += WEBSITE_UPLOAD_CONCURRENCY
  ) {
    const uploads = await Promise.allSettled(
      files
        .slice(offset, offset + WEBSITE_UPLOAD_CONCURRENCY)
        .map((file) => uploadWebsiteFile(bucket, artifactId, file)),
    );
    stored.push(
      ...uploads.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      ),
    );
    if (uploads.every((result) => result.status === 'fulfilled')) continue;

    await Promise.allSettled(
      stored.map((file) => bucket.delete(fileObjectId(file.fileKey))),
    );
    throw new ExpectedError(
      'Website files could not be saved to tenant storage. Do not retry this turn.',
    );
  }

  return stored;
};

export const deleteWebsiteFiles = async (
  models: IModels,
  fileKeys: string[],
): Promise<void> => {
  const bucket = await websiteBucket(models);
  const objectIds = fileKeys.flatMap((fileKey) => {
    try {
      return [fileObjectId(fileKey)];
    } catch {
      return [];
    }
  });
  await Promise.allSettled(
    objectIds.map((objectId) => bucket.delete(objectId)),
  );
};

export const openWebsiteFile = async (
  models: IModels,
  fileKey: string,
): Promise<Readable> => {
  const bucket = await websiteBucket(models);
  return bucket.openDownloadStream(fileObjectId(fileKey));
};
