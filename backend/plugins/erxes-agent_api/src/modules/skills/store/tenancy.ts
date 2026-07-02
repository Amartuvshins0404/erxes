import { randomUUID } from 'node:crypto';
import type { StorageSkillType } from '@mastra/core/storage';

// Per-subdomain tenancy for skills. All subdomains share the same Mongo
// connection + collections (the memory layer's MongoDBStore), so isolation
// rides on `authorId` (the only document-level filter `list()` supports on the
// thin skill record) plus an `id` namespace for defense in depth. The thin
// record carries NO metadata, so metadata-based scoping is impossible — see
// /tmp/skills-phase0-findings.md §3.

const SEP = '::';

/** Literal owner used for global (public) skills: seeds + promoted skills. */
export const SYSTEM_OWNER = 'system';

/** Empty/unknown subdomain maps to the same "os" scope the memory layer uses. */
export const normalizeSubdomain = (subdomain?: string): string =>
  (subdomain || 'os').trim() || 'os';

/**
 * Reject inputs containing the separator — otherwise a crafted subdomain or
 * ownerId could shift the boundary and defeat tenant isolation. Subdomains
 * (DNS labels) and erxes user ids never legitimately contain '::'.
 */
const assertNoSeparator = (value: string, label: string): void => {
  if (value.includes(SEP)) {
    throw new Error(`skills ${label} must not contain "${SEP}"`);
  }
};

/** `<subdomain>::<ownerId>` — the stored authorId for a skill. */
export const encodeAuthorId = (subdomain: string, ownerId: string): string => {
  const sub = normalizeSubdomain(subdomain);
  assertNoSeparator(sub, 'subdomain');
  assertNoSeparator(ownerId, 'ownerId');
  return `${sub}${SEP}${ownerId}`;
};

/** The system author for a subdomain's global skills. */
export const systemAuthorId = (subdomain: string): string =>
  encodeAuthorId(subdomain, SYSTEM_OWNER);

/**
 * Decode a stored authorId back to its owner id, but ONLY when it belongs to the
 * given subdomain. Returns undefined for a foreign subdomain — callers treat
 * that as "not found" so a crafted id can never read across tenants.
 */
export const decodeAuthorId = (
  authorId: string | undefined,
  subdomain: string,
): string | undefined => {
  if (!authorId) return undefined;
  const prefix = `${normalizeSubdomain(subdomain)}${SEP}`;
  return authorId.startsWith(prefix) ? authorId.slice(prefix.length) : undefined;
};

/** A fresh subdomain-namespaced skill id. */
export const newSkillId = (subdomain: string): string => {
  const sub = normalizeSubdomain(subdomain);
  assertNoSeparator(sub, 'subdomain');
  return `${sub}${SEP}${randomUUID()}`;
};

/**
 * Defense-in-depth check that a fetched record is the request subdomain's.
 * Verifies BOTH the id namespace and the decoded authorId.
 */
export const belongsToSubdomain = (
  record: Pick<StorageSkillType, 'id' | 'authorId'>,
  subdomain: string,
): boolean => {
  const prefix = `${normalizeSubdomain(subdomain)}${SEP}`;
  return (
    typeof record.id === 'string' &&
    record.id.startsWith(prefix) &&
    decodeAuthorId(record.authorId, subdomain) !== undefined
  );
};
