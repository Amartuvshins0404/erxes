import { ExpectedError } from 'erxes-api-shared/utils';
import {
  fetchAttachmentBuffer,
  fetchRemoteFile,
  isFullUrl,
  MAX_ATTACHMENT_BYTES,
} from './storage';

// ---------------------------------------------------------------------------
// Shared source addressing for tools that read a file's bytes. Three sources,
// same contract as file-reader (which this was extracted from):
//   • url        — a public http(s) link (SSRF-guarded via fetchRemoteFile),
//   • key        — a storage key from the message's "Attached files" manifest,
//   • an artifact row's fileKey — a storage key OR an inline data: URL.
// Keeping the resolution in one place means every consumer gets the identical
// security behavior (full-URL-as-key rejection, safeFetch, size caps).
// ---------------------------------------------------------------------------

export interface ResolvedFile {
  buffer: Buffer;
  name: string;
  /** Content type reported by the source (response header / data: prefix). */
  contentType?: string;
}

async function getSettings(subdomain: string) {
  // Lazy import avoids a module cycle (connectionResolvers → … → builtins).
  const { generateModels } = await import('~/connectionResolvers');
  const models = await generateModels(subdomain);
  return models.MastraSettings.getSettings();
}

/** Decode a base64 (or percent-encoded) `data:` URL into bytes + content type. */
export function decodeDataUrl(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
} {
  const m = dataUrl.match(/^data:([^;,]*)(;base64)?,([\s\S]*)$/);
  if (!m) throw new ExpectedError('Malformed data URL');
  return {
    contentType: m[1] || 'application/octet-stream',
    buffer: m[2]
      ? Buffer.from(m[3], 'base64')
      : Buffer.from(decodeURIComponent(m[3]), 'utf8'),
  };
}

/** Fetch a file from a public http(s) URL (SSRF-guarded inside fetchRemoteFile). */
export async function resolveByUrl(
  url: string,
  name?: string,
): Promise<ResolvedFile> {
  const fileName = name || nameFromUrl(url);
  const { buffer, contentType } = await fetchRemoteFile({
    url,
    name: fileName,
    maxBytes: MAX_ATTACHMENT_BYTES,
  });
  return { buffer, name: fileName, contentType };
}

/** Fetch a file the user attached, by its storage key.
 *  SECURITY: a `key` is a storage key, never a URL. Reject full URLs so a
 *  model-invented `key="http://169.254.169.254/..."` can't reach core's raw
 *  /read-file fetch (SSRF). Remote URLs must use the SSRF-guarded `url` path. */
export async function resolveByKey(
  subdomain: string,
  key: string,
  name?: string,
): Promise<ResolvedFile> {
  if (isFullUrl(key)) {
    throw new ExpectedError(
      'The `key` argument must be a storage key from the Attached files manifest, not a URL. To read a public link, pass it as `url` instead.',
    );
  }
  const settings = await getSettings(subdomain);
  const fileName = name || key.split('/').pop() || key;
  const { buffer, contentType } = await fetchAttachmentBuffer({
    erxesApiUrl: settings?.erxesApiUrl || 'http://localhost:4000',
    key,
    name: fileName,
  });
  return { buffer, name: fileName, contentType };
}

/** Fetch the file behind a stored artifact row (fileKey = data: URL or key). */
export async function resolveArtifactFile(
  subdomain: string,
  artifact: { fileKey?: string; fileName?: string; title?: string },
  artifactId: string,
): Promise<ResolvedFile> {
  const fileKey = artifact.fileKey || '';
  const fileName = artifact.fileName || artifact.title || artifactId;
  if (fileKey.startsWith('data:')) {
    const { buffer, contentType } = decodeDataUrl(fileKey);
    return { buffer, name: fileName, contentType };
  }
  const settings = await getSettings(subdomain);
  const { buffer, contentType } = await fetchAttachmentBuffer({
    erxesApiUrl: settings?.erxesApiUrl || 'http://localhost:4000',
    key: fileKey,
    name: fileName,
  });
  return { buffer, name: fileName, contentType };
}

/** Best-effort file name from a URL's last path segment. */
export function nameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : u.hostname;
  } catch {
    return url.split('/').pop() || url;
  }
}
