import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { uploadFileToStorage } from 'erxes-api-shared/utils';
import { getCurrentAuth } from '~/mastra/requestContext';
import { isFullUrl } from './storage';

// ---------------------------------------------------------------------------
// Persist a generated file (PDF/DOCX/XLSX buffer) into the instance's private
// storage and hand back a key the chat can download. The shared direct uploader
// handles configured cloud backends; core's /upload-file endpoint is the
// storage-authoritative fallback for local and cloud deployments alike.
//
// Only when both storage paths fail may document callers receive a bounded
// inline data: URL. Callers that require durable private storage opt out of that
// fallback.
// ---------------------------------------------------------------------------

const INLINE_FALLBACK_MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const CORE_UPLOAD_TIMEOUT_MS = 30_000;

function validatePrivateStorageKey(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Private storage did not return a file key');
  }

  const key = value.trim();
  if (!key) {
    throw new Error('Private storage returned an empty file key');
  }
  if (isFullUrl(key)) {
    throw new Error('Private storage returned a public URL');
  }

  return key;
}

function buildCoreUploadUrl(erxesApiUrl?: string): string {
  const configuredUrl = erxesApiUrl?.trim();
  if (!configuredUrl) {
    throw new Error('Core API URL is not configured');
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error('Core API URL must be a valid HTTP(S) URL');
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password
  ) {
    throw new Error('Core API URL must be a valid HTTP(S) URL');
  }

  url.hash = '';
  url.search = '';
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/upload-file`;
  url.searchParams.set('forcePrivate', 'true');
  return url.toString();
}

async function uploadThroughCore(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  erxesApiUrl?: string;
  subdomain: string;
}): Promise<string> {
  const { buffer, fileName, mimeType, erxesApiUrl, subdomain } = params;
  const form = new FormData();
  form.append(
    'file',
    new Blob(
      [new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)],
      { type: mimeType },
    ),
    fileName,
  );

  const response = await fetch(buildCoreUploadUrl(erxesApiUrl), {
    method: 'POST',
    headers: { 'x-subdomain': subdomain },
    body: form,
    redirect: 'error',
    signal: AbortSignal.timeout(CORE_UPLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Core file upload failed (HTTP ${response.status})`);
  }

  return validatePrivateStorageKey(await response.text());
}

export interface PersistedFile {
  // Storage key (read via core's /read-file) OR an inline data: URL.
  fileKey: string;
  size: number;
  // True when fileKey is an inline data URL.
  inline: boolean;
}

export async function persistGeneratedFile(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  allowInlineFallback?: boolean;
}): Promise<PersistedFile> {
  const { buffer, fileName, mimeType, allowInlineFallback = true } = params;
  const auth = getCurrentAuth();
  const subdomain = auth?.subdomain || 'localhost';
  const size = buffer.length;

  const workDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'agent-doc-'),
  );
  const filePath = path.join(workDir, fileName);

  try {
    await fs.promises.writeFile(filePath, buffer);
    if (!auth?.preferCoreFileUpload) {
      try {
        const key = validatePrivateStorageKey(
          await uploadFileToStorage({
            subdomain,
            filePath,
            fileName,
            mimetype: mimeType,
            forcePrivate: true,
          }),
        );
        return { fileKey: key, size, inline: false };
      } catch {
        if (auth) auth.preferCoreFileUpload = true;
      }
    }
    const key = await uploadThroughCore({
      buffer,
      fileName,
      mimeType,
      erxesApiUrl: auth?.erxesApiUrl,
      subdomain,
    });
    return { fileKey: key, size, inline: false };
  } catch {
    if (!allowInlineFallback) {
      throw new Error(
        'Could not save the generated file to private storage. Check the configured core API URL and file storage.',
      );
    }
    if (size > INLINE_FALLBACK_MAX_BYTES) {
      throw new Error(
        `Could not save the generated file to storage, and it is too large (${Math.round(
          size / 1024 / 1024,
        )} MB) to attach directly. Check the file storage configuration to enable document downloads.`,
      );
    }
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { fileKey: dataUrl, size, inline: true };
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}
