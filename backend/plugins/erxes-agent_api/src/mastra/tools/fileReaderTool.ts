import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getCurrentAuth } from '~/mastra/requestContext';
import {
  fetchAttachmentBuffer,
  fetchRemoteFile,
  MAX_ATTACHMENT_BYTES,
} from '~/mastra/files/storage';
import {
  extractFileText,
  fileExtension,
  isImageType,
} from '~/mastra/files/extract';
import { prepareImageForModel } from '~/mastra/files/imagePrep';

// ---------------------------------------------------------------------------
// file_reader — open a file. Three sources:
//   • url        — a public http(s) link the user pasted (or the agent found).
//                  SSRF-guarded; restricted to images + readable documents.
//   • key        — a file the USER attached (the storage key from the message's
//                  "Attached files" manifest), OR
//   • artifactId — a file the AGENT generated earlier this run (the id returned
//                  by generatePdf/Docx/Xlsx/Pptx).
//
// Images are returned so the model can SEE them — handed over as a multimodal
// tool result via toModelOutput. Large images are downscaled first (see
// imagePrep) so their base64 fits the provider's request budget. Everything
// else is read as text: pdf, docx, xlsx/xls, pptx, csv, txt, md, json, html.
// Any other type (zip, exe, …) is refused. Always bound (see agentRuntime).
// ---------------------------------------------------------------------------

const readerOutput = z.object({
  name: z.string(),
  format: z.string(),
  characters: z.number(),
  truncated: z.boolean(),
  content: z.string(),
  // Set only for a viewable image. The image bytes are NOT carried here — they
  // reach the model through toModelOutput; this is just the lookup token, so the
  // persisted/logged structured output stays small.
  imageToken: z.string().optional(),
});

type ReaderResult = z.infer<typeof readerOutput>;

// ─── Image handoff: execute() → toModelOutput() ──────────────────────────────
// The model sees an image via a multimodal tool result, but the structured
// output (persisted, logged, used for fallback synthesis) must stay tiny. So the
// base64 lives in this short-lived map keyed by a token, and toModelOutput reads
// it back. Bounded + read-once so a burst of reads can't grow it without limit.
interface PendingImage {
  data: string;
  mediaType: string;
  name: string;
}
const pendingImages = new Map<string, PendingImage>();
const MAX_PENDING_IMAGES = 6;
let imageSeq = 0;

function stashImage(img: PendingImage): string {
  const token = `fr-img-${++imageSeq}`;
  if (pendingImages.size >= MAX_PENDING_IMAGES) {
    const oldest = pendingImages.keys().next().value;
    if (oldest) pendingImages.delete(oldest);
  }
  pendingImages.set(token, img);
  return token;
}

/** Decode a base64 (or percent-encoded) `data:` URL into bytes + content type. */
function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  const m = dataUrl.match(/^data:([^;,]*)(;base64)?,([\s\S]*)$/);
  if (!m) throw new Error('Malformed data URL');
  return {
    contentType: m[1] || 'application/octet-stream',
    buffer: m[2]
      ? Buffer.from(m[3], 'base64')
      : Buffer.from(decodeURIComponent(m[3]), 'utf8'),
  };
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

/** Normalize an image's media type from its content-type, falling back to ext. */
export function resolveImageMime(name: string, contentType?: string): string {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase();
  if (ct.startsWith('image/')) return ct === 'image/jpg' ? 'image/jpeg' : ct;
  const byExt: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    avif: 'image/avif',
  };
  return byExt[fileExtension(name)] || 'image/png';
}

/**
 * Build the reader result for an image.
 *   - SVG → source text (it is XML; useful to every model).
 *   - Otherwise the image is downscaled to fit the request budget and stashed
 *     for toModelOutput so the model SEES it. An image too large to shrink
 *     (a rare undecodable format) returns a readable note instead.
 */
async function imageResult(
  buffer: Buffer,
  name: string,
  contentType: string | undefined,
): Promise<ReaderResult> {
  const mediaType = resolveImageMime(name, contentType);

  if (mediaType === 'image/svg+xml') {
    const source = buffer.toString('utf8').slice(0, 20_000);
    return {
      name,
      format: 'image',
      characters: source.length,
      truncated: false,
      content: source,
    };
  }

  const prepared = await prepareImageForModel(buffer, mediaType);
  if (!prepared) {
    return {
      name,
      format: 'image',
      characters: 0,
      truncated: false,
      content: `[Image "${name}" (${mediaType}) couldn't be prepared for viewing — too large or an unsupported format. Ask the user for a PNG or JPEG.]`,
    };
  }

  const imageToken = stashImage({
    data: prepared.data,
    mediaType: prepared.mediaType,
    name,
  });
  return {
    name,
    format: 'image',
    characters: 0,
    truncated: false,
    content: `[Image "${name}" is shown to you directly.]`,
    imageToken,
  };
}

/** Decide image-vs-text from the bytes and build the result. */
export async function buildResult(
  buffer: Buffer,
  name: string,
  mimeType?: string,
): Promise<ReaderResult> {
  if (isImageType(name, mimeType)) return imageResult(buffer, name, mimeType);
  const extracted = await extractFileText({ buffer, name, mimeType });
  return {
    name,
    format: extracted.format,
    characters: extracted.content.length,
    truncated: extracted.truncated,
    content: extracted.content,
  };
}

async function getModels(subdomain: string) {
  // Lazy import avoids a module cycle (connectionResolvers → … → builtins).
  const { generateModels } = await import('~/connectionResolvers');
  return generateModels(subdomain);
}

/** Read a file from a public http(s) URL (SSRF-guarded inside fetchRemoteFile). */
async function readByUrl(url: string, name?: string): Promise<ReaderResult> {
  const fileName = name || nameFromUrl(url);
  const { buffer, contentType } = await fetchRemoteFile({
    url,
    name: fileName,
    maxBytes: MAX_ATTACHMENT_BYTES,
  });
  return buildResult(buffer, fileName, contentType);
}

/** Read a file the user attached, by its storage key / URL. */
async function readByKey(
  subdomain: string,
  key: string,
  name?: string,
): Promise<ReaderResult> {
  const models = await getModels(subdomain);
  const settings = await models.MastraSettings.getSettings();
  const fileName = name || key.split('/').pop() || key;
  const { buffer, contentType } = await fetchAttachmentBuffer({
    erxesApiUrl: settings?.erxesApiUrl || 'http://localhost:4000',
    keyOrUrl: key,
    name: fileName,
  });
  return buildResult(buffer, fileName, contentType);
}

/** Read back an artifact the agent generated earlier this run, by its id. */
async function readByArtifactId(
  subdomain: string,
  artifactId: string,
): Promise<ReaderResult> {
  const models = await getModels(subdomain);
  const artifact = await models.MastraArtifact.getByArtifactId(artifactId);
  if (!artifact) {
    throw new Error(`No artifact found with id "${artifactId}".`);
  }

  // Chart artifacts carry no file — surface their spec as readable JSON.
  if (artifact.kind === 'chart') {
    const content = JSON.stringify(artifact.spec ?? {}, null, 2);
    return {
      name: artifact.title || artifactId,
      format: 'chart',
      characters: content.length,
      truncated: false,
      content,
    };
  }

  const fileKey = artifact.fileKey || '';
  const fileName = artifact.fileName || artifact.title || artifactId;
  let buffer: Buffer;
  let contentType: string;
  if (fileKey.startsWith('data:')) {
    ({ buffer, contentType } = decodeDataUrl(fileKey));
  } else {
    const settings = await models.MastraSettings.getSettings();
    ({ buffer, contentType } = await fetchAttachmentBuffer({
      erxesApiUrl: settings?.erxesApiUrl || 'http://localhost:4000',
      keyOrUrl: fileKey,
      name: fileName,
    }));
  }
  return buildResult(buffer, fileName, artifact.mimeType || contentType);
}

export const fileReaderTool = createTool({
  id: 'file-reader',
  description:
    'Read a file. Pass `url` to fetch a public http(s) link (e.g. one the user ' +
    'pasted), `artifactId` to read back a file you generated earlier this run ' +
    '(the id returned by generatePdf / generateDocx / generateXlsx / ' +
    'generatePptx), or `key` to read a file the user attached (the exact key from ' +
    'the message\'s "Attached files" manifest). Images (png/jpeg/gif/webp) are ' +
    'shown to you so you can SEE them — use this to look at an image given by a ' +
    'URL. pdf, docx, xlsx/xls, pptx, csv, txt, md, json and html are returned as text. ' +
    'Other file types (zip, exe, video, …) are not supported. You do NOT need ' +
    'this for an image the user attached to the message — that is already visible.',
  inputSchema: z.object({
    url: z
      .string()
      .optional()
      .describe(
        'Public http(s) URL of an image or document to fetch and read. Images ' +
          'are shown to you visually; documents are returned as text.',
      ),
    key: z
      .string()
      .optional()
      .describe(
        'Storage key (or URL) of a file the USER attached, exactly as given in the Attached files manifest.',
      ),
    artifactId: z
      .string()
      .optional()
      .describe('Id of a file you generated earlier this run (from a generate tool result).'),
    name: z.string().optional().describe('File name, for friendlier errors.'),
  }),
  outputSchema: readerOutput,
  execute: async ({ url, key, artifactId, name }) => {
    const auth = getCurrentAuth();
    const subdomain = auth?.subdomain || 'localhost';
    if (url) return readByUrl(url, name);
    if (artifactId) return readByArtifactId(subdomain, artifactId);
    if (key) return readByKey(subdomain, key, name);
    throw new Error(
      'Provide a url (public link), an artifactId (a file you generated), or a key (a user attachment).',
    );
  },
  // Make a viewable image actually visible to the model: hand it back as a
  // multimodal tool result. Non-image reads return their text fields as-is.
  toModelOutput: (out) => {
    const result = out as ReaderResult;
    if (result.imageToken) {
      const img = pendingImages.get(result.imageToken);
      if (img) {
        pendingImages.delete(result.imageToken);
        return {
          type: 'content',
          value: [
            { type: 'text', text: `Image "${img.name}" (${img.mediaType}):` },
            { type: 'media', data: img.data, mediaType: img.mediaType },
          ],
        };
      }
    }
    return {
      type: 'json',
      value: {
        name: result.name,
        format: result.format,
        characters: result.characters,
        truncated: result.truncated,
        content: result.content,
      },
    };
  },
});
