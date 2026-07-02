import { Jimp } from 'jimp';

// ---------------------------------------------------------------------------
// Prepare an image for inlining into the model's input.
//
// Why downscale: an image is sent as base64 inside the request, and providers
// cap the TOTAL request size. Kimi ("kimi-for-coding") allows only ~2MB, so a
// 3–4MB photo overflows the whole turn (HTTP 400). Resizing the long edge to
// ~1280px and re-encoding JPEG brings any photo to a few hundred KB — which
// fits every provider's budget AND is the resolution vision models actually
// want (Anthropic recommends ≤1568px). Small images are passed through
// untouched, preserving their format (incl. webp/gif jimp can't re-encode).
// ---------------------------------------------------------------------------

// Images at or below this already fit any provider budget (base64 ≈ +37%, so
// 500KB → ~685KB) — keep them as-is, in their original format.
const KEEP_ORIGINAL_BYTES = 500 * 1024;
// Long-edge target for downscaled images; shrink further (down to MIN_EDGE) if
// the re-encoded JPEG still exceeds TARGET_BYTES.
const MAX_EDGE = 1280;
const MIN_EDGE = 512;
const JPEG_QUALITY = 80;
const TARGET_BYTES = 700 * 1024;

// Original formats safe to inline untouched — every supported vision provider
// accepts these. bmp/avif/tiff are re-encoded (or noted) instead.
const PASSTHROUGH_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

export interface PreparedImage {
  /** base64-encoded image bytes (no data: prefix). */
  data: string;
  /** IANA media type of `data` (image/jpeg after a re-encode). */
  mediaType: string;
}

/**
 * Downscale + re-encode an image so its base64 fits a model request budget.
 * Returns the prepared image, or null when the bytes are too large to fit AND
 * can't be decoded for resizing (e.g. an oversized webp/avif) — the caller then
 * surfaces a readable note instead of a broken request.
 */
export async function prepareImageForModel(
  buffer: Buffer,
  mediaType: string,
): Promise<PreparedImage | null> {
  // Small + already a widely-accepted format → keep original bytes/format.
  if (buffer.length <= KEEP_ORIGINAL_BYTES && PASSTHROUGH_MIME.has(mediaType)) {
    return { data: buffer.toString('base64'), mediaType };
  }

  // Otherwise resize + re-encode to JPEG. Needs a jimp-decodable raster; an
  // undecodable format over the keep-as-is bound (e.g. a large webp/avif) can't
  // be shrunk here, so the caller surfaces a note instead.
  let image;
  try {
    image = await Jimp.read(buffer);
  } catch {
    return null;
  }

  let edge = MAX_EDGE;
  for (let attempt = 0; attempt < 4; attempt++) {
    const clone = image.clone();
    const longest = Math.max(clone.width, clone.height);
    if (longest > edge) {
      if (clone.width >= clone.height) clone.resize({ w: edge });
      else clone.resize({ h: edge });
    }
    const out = await clone.getBuffer('image/jpeg', { quality: JPEG_QUALITY });
    if (out.length <= TARGET_BYTES || edge <= MIN_EDGE) {
      return { data: out.toString('base64'), mediaType: 'image/jpeg' };
    }
    edge = Math.max(MIN_EDGE, Math.round(edge * 0.75));
  }
  return null;
}
