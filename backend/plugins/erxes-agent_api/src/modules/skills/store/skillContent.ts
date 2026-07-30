import { createGlobMatcher } from '@mastra/core/workspace';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { StorageSkillSnapshotType } from '@mastra/core/storage';
import type { ISkillContent } from '@/skills/@types/skills';

// SKILL.md (de)serialization, validation, reserved-metadata handling and glob
// matching for skill content. The Agent Skills spec puts metadata in YAML
// frontmatter and agent-facing prose in the markdown body.

/** Recommended limits from the Agent Skills spec (mirrors @mastra SKILL_LIMITS). */
export const SKILL_LIMITS = {
  maxName: 64,
  maxDescription: 1024,
  /** ~4 chars/token heuristic — the spec caps instructions at ~5000 tokens. */
  maxInstructionTokens: 5000,
} as const;

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Reserved keys we store inside the version snapshot's `metadata` bag. */
export interface SkillMeta {
  subdomain: string;
  category?: string;
  userInvocable: boolean;
  /** Author-supplied arbitrary metadata. */
  data?: Record<string, unknown>;
}

/** Rough token estimate (chars / 4) — good enough for the spec's soft cap. */
export const estimateTokens = (text: string): number =>
  Math.ceil((text?.length ?? 0) / 4);

/** Validate user-provided skill content; throws a user-facing ExpectedError. */
export const validateSkillContent = (content: ISkillContent): void => {
  const name = (content.name || '').trim();
  if (!name || name.length > SKILL_LIMITS.maxName || !NAME_RE.test(name)) {
    throw new ExpectedError(
      `Skill name must be 1-${SKILL_LIMITS.maxName} lowercase letters, numbers or hyphens (got "${content.name}")`,
    );
  }
  const description = (content.description || '').trim();
  if (!description || description.length > SKILL_LIMITS.maxDescription) {
    throw new ExpectedError(
      `Skill description is required and must be <= ${SKILL_LIMITS.maxDescription} characters`,
    );
  }
  const instructions = content.instructions || '';
  if (!instructions.trim()) {
    throw new ExpectedError('Skill instructions are required');
  }
  if (estimateTokens(instructions) > SKILL_LIMITS.maxInstructionTokens) {
    throw new ExpectedError(
      `Skill instructions are too long (~${estimateTokens(instructions)} tokens, max ${SKILL_LIMITS.maxInstructionTokens})`,
    );
  }
  if (content.category && !NAME_RE.test(content.category)) {
    throw new ExpectedError(
      'Skill category must be lowercase letters, numbers or hyphens',
    );
  }
};

/** Build the snapshot `metadata` bag from request content + the subdomain. */
export const buildSnapshotMetadata = (
  subdomain: string,
  content: Pick<ISkillContent, 'category' | 'userInvocable' | 'metadata'>,
): Record<string, unknown> => ({
  subdomain,
  category: content.category,
  userInvocable: content.userInvocable !== false,
  data: content.metadata,
});

/** Read the reserved keys back out of a snapshot's `metadata` bag. */
export const readSnapshotMetadata = (
  metadata: Record<string, unknown> | undefined,
): SkillMeta => {
  const m = (metadata ?? {}) as Record<string, unknown>;
  return {
    subdomain: typeof m.subdomain === 'string' ? m.subdomain : '',
    category: typeof m.category === 'string' ? m.category : undefined,
    userInvocable: m.userInvocable !== false,
    data:
      m.data && typeof m.data === 'object' && !Array.isArray(m.data)
        ? (m.data as Record<string, unknown>)
        : undefined,
  };
};

/**
 * Serialize a stored version snapshot to SKILL.md text for the agent to read.
 * Scalar values are JSON-encoded so the YAML frontmatter is always valid (YAML
 * is a superset of JSON for double-quoted scalars), even with colons/newlines.
 */
export const serializeSkillMd = (
  snapshot: Pick<
    StorageSkillSnapshotType,
    'name' | 'description' | 'instructions' | 'metadata'
  >,
): string => {
  const meta = readSnapshotMetadata(snapshot.metadata);
  const lines = [
    '---',
    `name: ${JSON.stringify(snapshot.name)}`,
    `description: ${JSON.stringify(snapshot.description)}`,
    `user-invocable: ${meta.userInvocable}`,
    '---',
    '',
    (snapshot.instructions || '').trim(),
    '',
  ];
  return lines.join('\n');
};

/** Candidate keys an agent glob can match: bare name and `category/name`. */
export const skillMatchKeys = (name: string, category?: string): string[] =>
  category ? [name, `${category}/${name}`] : [name];

/**
 * Does any of a skill's match keys satisfy the agent's allowlist globs?
 * Patterns use picomatch semantics (`*`, `**`, `{a,b}`) via Mastra's matcher.
 */
export const matchesGlobs = (
  globs: string[],
  name: string,
  category?: string,
): boolean => {
  if (!globs.length) return false;
  const match = createGlobMatcher(globs, { dot: true });
  return skillMatchKeys(name, category).some((key) => match(key));
};
