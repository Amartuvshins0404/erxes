import { Message } from '~/modules/chat/types';
import {
  IMastraSkillCreateInput,
  SkillMetadata,
  SkillStatus,
  SkillVisibility,
} from './types';
import { SkillFormValues } from './validations';

// Slugify a free-text name into the contract's skill-name shape (lowercase
// letters/numbers/hyphens). Used to auto-fill the name field from a title.
export const toSkillSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

// Parse the metadata textarea into a JSON object. Empty text is valid (no
// metadata). A non-object or malformed value returns an error message.
export const parseMetadata = (
  text: string,
): { value?: SkillMetadata; error?: string } => {
  const trimmed = text.trim();
  if (!trimmed) return { value: undefined };
  try {
    const parsed = JSON.parse(trimmed);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { error: 'Metadata must be a JSON object' };
    }
    return { value: parsed as SkillMetadata };
  } catch {
    return { error: 'Metadata must be valid JSON' };
  }
};

// Map validated form values to the create/update doc. `category` and `metadata`
// are sent explicitly (empty string / empty object) rather than omitted, so
// blanking a previously-set value clears it server-side instead of being dropped
// from the payload. Returns a metadata error instead of a doc when the JSON is
// malformed.
export const skillFormToDoc = (
  values: SkillFormValues,
): { doc: IMastraSkillCreateInput | null; metadataError?: string } => {
  const meta = parseMetadata(values.metadataText);
  if (meta.error) return { doc: null, metadataError: meta.error };
  return {
    doc: {
      name: values.name,
      description: values.description,
      instructions: values.instructions,
      userInvocable: values.userInvocable,
      category: values.category.trim(),
      metadata: meta.value ?? {},
    },
  };
};

// Pretty-print metadata back into the textarea (empty when there is none).
export const stringifyMetadata = (metadata?: SkillMetadata | null): string => {
  if (!metadata || Object.keys(metadata).length === 0) return '';
  return JSON.stringify(metadata, null, 2);
};

export const skillStatusVariant = (
  status: SkillStatus,
): 'success' | 'secondary' | 'destructive' => {
  if (status === 'published') return 'success';
  if (status === 'archived') return 'destructive';
  return 'secondary';
};

export const skillStatusLabel = (status: SkillStatus): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const skillVisibilityLabel = (visibility: SkillVisibility): string =>
  visibility === 'public' ? 'Global' : 'Private';

// The leading `/query` the composer is typing, or null when not in slash mode.
// Slash mode = a single leading slash followed by non-space chars and nothing
// after a space (so "/sal" matches but "hello / world" does not).
export const matchSlashQuery = (input: string): string | null => {
  const match = /^\/(\S*)$/.exec(input);
  return match ? match[1] : null;
};

// A skill draft surfaced by the makeSkill agent tool, ready to review/publish.
export interface DraftSkillRef {
  _id: string;
  name?: string;
}

const isDraftSkillResult = (result: unknown): DraftSkillRef | null => {
  if (!result || typeof result !== 'object') return null;
  const r = result as { _id?: unknown; status?: unknown; name?: unknown };
  if (typeof r._id !== 'string' || r.status !== 'draft') return null;
  return { _id: r._id, name: typeof r.name === 'string' ? r.name : undefined };
};

// Scan a thread's messages for the most recent makeSkill tool result that
// produced a draft skill — the UI surfaces it for review/edit/publish.
export const findDraftSkillFromMessages = (
  messages: Message[],
): DraftSkillRef | null => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const parts = messages[i].parts;
    if (!parts) continue;
    for (let j = parts.length - 1; j >= 0; j -= 1) {
      const part = parts[j];
      if (part.kind !== 'tool') continue;
      if (!/make.?skill|skillfromthread/i.test(part.call.toolName)) continue;
      const draft = isDraftSkillResult(part.call.result);
      if (draft) return draft;
    }
  }
  return null;
};
