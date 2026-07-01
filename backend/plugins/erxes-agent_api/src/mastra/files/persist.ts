import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { uploadFileToStorage } from 'erxes-api-shared/utils';
import { getCurrentAuth } from '~/mastra/requestContext';
import { isFullUrl } from './storage';

// ---------------------------------------------------------------------------
// Persist a generated file (PDF/DOCX/XLSX buffer) into the instance's storage
// and hand back a reference the chat can download. Mirrors how content_api
// persists rendered pages: write to an os.tmpdir() file, then uploadFileToStorage
// (which fetches the instance's storage configs itself and returns a key).
//
// uploadFileToStorage throws on UPLOAD_SERVICE_TYPE=local (shared utils can't
// reach core's local disk). For that case — and any upload failure — we fall
// back to an inline data: URL so the user can still download the file, capping
// the size so we never bloat a stored message with megabytes of base64.
// ---------------------------------------------------------------------------

const INLINE_FALLBACK_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export interface PersistedFile {
  // Storage key (read via core's /read-file) OR an inline data: URL.
  fileKey: string;
  size: number;
  // True when fileKey is a data:/full URL the UI can use directly.
  inline: boolean;
}

export async function persistGeneratedFile(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<PersistedFile> {
  const { buffer, fileName, mimeType } = params;
  const subdomain = getCurrentAuth()?.subdomain || 'localhost';
  const size = buffer.length;

  const workDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'agent-doc-'),
  );
  const filePath = path.join(workDir, fileName);

  try {
    await fs.promises.writeFile(filePath, buffer);
    const key = await uploadFileToStorage({
      subdomain,
      filePath,
      fileName,
      mimetype: mimeType,
      forcePrivate: true,
    });
    return { fileKey: key, size, inline: isFullUrl(key) };
  } catch {
    if (size > INLINE_FALLBACK_MAX_BYTES) {
      throw new Error(
        `Could not save the generated file to storage, and it is too large (${Math.round(
          size / 1024 / 1024,
        )} MB) to attach directly. Configure cloud file storage (S3/R2/GCS/Azure) to enable document downloads.`,
      );
    }
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { fileKey: dataUrl, size, inline: true };
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}
