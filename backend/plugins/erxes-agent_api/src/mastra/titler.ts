// Fast, deterministic conversation titles. Titling must never consume another
// provider request: the first meaningful user message is available before the
// agent runs and already contains the best topic signal.

import { trimEdgeChars } from '~/mastra/text';

const TITLE_MAX_CHARS = 60;
const TITLE_MAX_WORDS = 8;
const ATTACHMENT_MANIFEST = '--- Attached files ---';
const GREETING_ONLY =
  /^(?:hi|hello|hey|good (?:morning|afternoon|evening)|sain uu|сайн уу)[.!?]*$/i;

/** Normalize a title candidate into one compact sidebar label. */
export function sanitizeTitle(raw: string | null | undefined): string | null {
  let title = (raw || '').split('\n')[0].replace(/\s+/g, ' ').trim();
  title = title.replace(/^title\s*:\s*/i, '');
  title = trimEdgeChars(title, '"\'`“”‘’', '"\'`“”‘’.!?;,').trim();
  if (!title) return null;
  if (title.length > TITLE_MAX_CHARS) {
    title = `${title.slice(0, TITLE_MAX_CHARS - 1).trimEnd()}…`;
  }
  return title;
}

/**
 * Derive a stable title from the first meaningful user request without an LLM.
 * Attachment manifests and Markdown decoration are excluded from the label.
 */
export function deriveThreadTitle(message: string): string | null {
  const request = (message || '')
    .split(ATTACHMENT_MANIFEST)[0]
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[`*_#>[\\\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!request || GREETING_ONLY.test(request)) return null;
  return sanitizeTitle(request.split(' ').slice(0, TITLE_MAX_WORDS).join(' '));
}
