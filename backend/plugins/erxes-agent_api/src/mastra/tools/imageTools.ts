import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Jimp } from 'jimp';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ExpectedError } from 'erxes-api-shared/utils';
import { getCurrentAuth } from '~/mastra/requestContext';
import { isImageType } from '~/mastra/files/extract';
import {
  resolveArtifactFile,
  resolveByKey,
  resolveByUrl,
  type ResolvedFile,
} from '~/mastra/files/resolveSource';
import { persistGeneratedFile } from '~/mastra/files/persist';
import { storeArtifact } from '~/mastra/artifactStore';
import { resolveImageMime } from './fileReaderTool';
import {
  imageArtifactSchema,
  newArtifactId,
  type ImageArtifact,
} from './artifacts';

// ---------------------------------------------------------------------------
// remove-image-background — cut the background out of an image (typically a
// phone-taken product photo) and return a transparent PNG as an `image`
// artifact for the Preview panel.
//
// Inference runs IN-PROCESS via @imgly/background-removal-node (onnxruntime +
// isnet; the model assets ship inside the npm package — no external service).
// That makes it memory-heavy: a single inference peaks well over 1GB. Two
// guards keep that survivable on a shared host:
//   • inputs are downscaled to MAX_INPUT_EDGE before inference, and
//   • inferences are serialized process-wide (one at a time) so parallel chats
//     queue instead of stacking gigabyte spikes.
// ---------------------------------------------------------------------------

// Pre-inference bound on the long edge. Also keeps the output PNG comfortably
// under persist.ts's 4MB inline-fallback cap so dev (local storage) still works.
const MAX_INPUT_EDGE = 1600;
// Output bound for inputs Jimp couldn't decode pre-inference (e.g. webp, which
// imgly itself decodes via sharp) — enforced on the PNG that comes back.
const MAX_OUTPUT_EDGE = 2048;
const INFERENCE_TIMEOUT_MS = 120_000;

// Lazy singleton import — onnxruntime + the model manifest load only on first
// use, so instances that never remove a background pay no startup cost.
let libPromise: Promise<typeof import('@imgly/background-removal-node')> | null =
  null;
function loadLib() {
  return (libPromise ??= import('@imgly/background-removal-node'));
}

/** The package's dist/ dir as a file:// URL, independent of process.cwd().
 *  (The lib's default publicPath is cwd-relative and breaks under jest/nx.) */
function imglyPublicPath(): string {
  // …/dist/index.cjs — the package does not export its package.json.
  const entry = require.resolve('@imgly/background-removal-node');
  return `${pathToFileURL(path.dirname(entry)).href}/`;
}

// One inference at a time, process-wide. The queued task hands back TWO
// promises: `result` is what the caller awaits (typically deadline-raced),
// while the slot is held on `hold` — the raw inference, which is NOT
// abortable. Chaining the slot on the raced promise instead would release it
// the moment a timeout fires while the >1GB inference keeps running, letting
// the next request stack a second one (the exact pile-up this mutex exists to
// prevent). The chain never rejects, so a failed run can't wedge it.
// Exported for the regression test.
let chain: Promise<unknown> = Promise.resolve();
export function serialize<T>(
  fn: () => { result: Promise<T>; hold: Promise<unknown> },
): Promise<T> {
  const entry = chain.then(fn, fn);
  chain = entry.then((e) => e.hold).catch(() => undefined);
  return entry.then((e) => e.result);
}

/** Race a promise against a deadline, always clearing the timer. The deadline
 *  only unblocks the CALLER — the underlying task keeps running (no
 *  AbortSignal in the lib); serialize's `hold` keeps the mutex slot occupied
 *  until it settles. Exported for the regression test. */
export async function withDeadline<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new ExpectedError(
            'Background removal timed out. Try again with a smaller image.',
          ),
        ),
      ms,
    );
  });
  try {
    return await Promise.race([p, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

/** Downscale a decodable image to `maxEdge`, re-encoding PNG (preserves any
 *  alpha). Undecodable formats (webp/avif) pass through untouched — imgly
 *  decodes those itself via sharp. */
async function boundImage(
  buffer: Buffer,
  maxEdge: number,
): Promise<{ buffer: Buffer; width?: number; height?: number }> {
  let image;
  try {
    image = await Jimp.read(buffer);
  } catch {
    return { buffer };
  }
  if (Math.max(image.width, image.height) <= maxEdge) {
    return { buffer, width: image.width, height: image.height };
  }
  if (image.width >= image.height) image.resize({ w: maxEdge });
  else image.resize({ h: maxEdge });
  const out = await image.getBuffer('image/png');
  return { buffer: out, width: image.width, height: image.height };
}

async function resolveSource(params: {
  subdomain: string;
  url?: string;
  key?: string;
  artifactId?: string;
}): Promise<ResolvedFile> {
  const { subdomain, url, key, artifactId } = params;
  if (url) return resolveByUrl(url);
  if (key) return resolveByKey(subdomain, key);
  if (artifactId) {
    // Lazy import avoids a module cycle (connectionResolvers → … → builtins).
    const { generateModels } = await import('~/connectionResolvers');
    const models = await generateModels(subdomain);
    const artifact = await models.MastraArtifact.getByArtifactId(artifactId);
    if (!artifact) {
      throw new ExpectedError(`No artifact found with id "${artifactId}".`);
    }
    if (!artifact.fileKey) {
      throw new ExpectedError(
        `Artifact "${artifactId}" is a ${artifact.kind} and carries no image file.`,
      );
    }
    return resolveArtifactFile(subdomain, artifact, artifactId);
  }
  throw new ExpectedError(
    'Provide a key (a user attachment from the Attached files manifest), a url (public image link), or an artifactId (an image generated earlier this run).',
  );
}

export const removeImageBackgroundTool = createTool({
  id: 'remove-image-background',
  description:
    'Remove the background from a photo (e.g. a product shot), producing a ' +
    'clean transparent PNG cut-out. Pass `key` for an image the user attached ' +
    '(the exact key from the "Attached files" manifest), `url` for a public ' +
    'image link, or `artifactId` for an image produced earlier this run. The ' +
    'result opens in the Preview panel. The returned `attachment` object is ' +
    'ready to pass as the `attachment` argument of product mutations ' +
    '(e.g. productsEdit) when the user wants it set as a product image.',
  inputSchema: z.object({
    key: z
      .string()
      .optional()
      .describe(
        'Storage key of an image the USER attached, exactly as given in the Attached files manifest. Must be a storage key, not a URL — pass remote links as `url`.',
      ),
    url: z
      .string()
      .optional()
      .describe('Public http(s) URL of the image to process.'),
    artifactId: z
      .string()
      .optional()
      .describe('Id of an image artifact produced earlier this run.'),
    title: z
      .string()
      .max(200)
      .optional()
      .describe(
        'Short human title for the result (e.g. the product name). Defaults to the source file name.',
      ),
  }),
  outputSchema: z.object({
    artifact: imageArtifactSchema,
    // erxes AttachmentInput shape, ready for productsEdit/productsAdd. Absent
    // when the instance has no cloud storage (inline data: results must never
    // be written into a product attachment).
    attachment: z
      .object({
        url: z.string(),
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
      .optional(),
  }),
  execute: async ({ key, url, artifactId, title }) => {
    if ((process.env.ERXES_AGENT_BG_REMOVAL ?? '').trim() === 'disable') {
      throw new ExpectedError(
        'Background removal is disabled on this instance.',
      );
    }
    const subdomain = getCurrentAuth()?.subdomain || 'localhost';
    const source = await resolveSource({ subdomain, url, key, artifactId });

    const mediaType = resolveImageMime(source.name, source.contentType);
    if (!isImageType(source.name, source.contentType)) {
      throw new ExpectedError(
        `"${source.name}" is not an image — background removal needs a photo (png/jpeg/webp).`,
      );
    }
    if (mediaType === 'image/svg+xml') {
      throw new ExpectedError(
        'SVG images are vector graphics and have no photographic background to remove.',
      );
    }

    // Bound the pixels BEFORE inference (memory + inline-fallback size).
    const bounded = await boundImage(source.buffer, MAX_INPUT_EDGE);

    const { removeBackground } = await loadLib();
    // A typed Blob, NOT raw bytes: the lib wraps a Uint8Array in a TYPELESS
    // Blob whose empty MIME hits imageDecode's unsupported-format branch.
    // octet-stream routes to sharp, which sniffs the real format from magic
    // bytes — so png/jpeg/webp all decode regardless of what the name said.
    const input = new Blob([new Uint8Array(bounded.buffer)], {
      type: 'application/octet-stream',
    });
    const blob = await serialize(() => {
      const inference = removeBackground(input, {
        publicPath: imglyPublicPath(),
        model: 'medium',
        output: { format: 'image/png' },
      });
      // Caller gets the deadline-raced promise; the mutex slot is held on the
      // inference itself so a timed-out run can't overlap the next one.
      return {
        result: withDeadline(inference, INFERENCE_TIMEOUT_MS),
        hold: inference.catch(() => undefined),
      };
    });
    let out = Buffer.from(await blob.arrayBuffer());

    // Jimp-undecodable inputs (webp) skipped the pre-bound — bound the PNG that
    // came back instead, and pick up final dimensions for the artifact.
    const outBounded = await boundImage(out, MAX_OUTPUT_EDGE);
    out = outBounded.buffer;

    const displayTitle = title?.trim() || baseName(source.name);
    const fileName = `${slugify(displayTitle)}-nobg.png`;
    const persisted = await persistGeneratedFile({
      buffer: out,
      fileName,
      mimeType: 'image/png',
    });

    const artifact: ImageArtifact = {
      id: newArtifactId('img'),
      kind: 'image',
      title: displayTitle,
      fileName,
      mimeType: 'image/png',
      fileKey: persisted.fileKey,
      inline: persisted.inline,
      size: persisted.size,
      width: outBounded.width,
      height: outBounded.height,
    };
    await storeArtifact(artifact);

    return {
      artifact,
      attachment: persisted.inline
        ? undefined
        : {
            url: persisted.fileKey,
            name: fileName,
            type: 'image/png',
            size: persisted.size,
          },
    };
  },
});

/** File name without its extension. */
function baseName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function slugify(title: string): string {
  return (
    (title || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'image'
  );
}

// Heterogeneous createTool instances; registered into BUILTIN_TOOLS.
export const IMAGE_BUILTIN_TOOLS: Record<
  string,
  ReturnType<typeof createTool>
> = {
  removeImageBackground: removeImageBackgroundTool,
};
