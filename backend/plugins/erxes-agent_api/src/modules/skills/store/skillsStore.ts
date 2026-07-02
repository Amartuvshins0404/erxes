import type { SkillsStorage } from '@mastra/core/storage/domains/skills';
import type {
  StorageResolvedSkillType,
  StorageVisibility,
} from '@mastra/core/storage';
import { getMastraStore } from '~/mastra/memory/mastraMemory';
import { SkillStatus, ISkillContent } from '@/skills/@types/skills';
import {
  buildSnapshotMetadata,
  validateSkillContent,
} from '@/skills/store/skillContent';
import {
  belongsToSubdomain,
  encodeAuthorId,
  newSkillId,
  normalizeSubdomain,
} from '@/skills/store/tenancy';
import { ensureSeedSkills } from '@/skills/seed/seedSkills';

// Subdomain-scoped persistence over @mastra/mongodb's MongoDBSkillsStorage. This
// is the ONLY module that touches the raw storage domain; every read injects the
// subdomain (via authorId) and every single-doc fetch verifies tenancy, so
// skills can never leak across subdomains. Reuses the memory layer's Mongo
// connection (one connection, shared collections).
//
// Resolution: `listResolved`/getByIdResolved overload `status` as BOTH a record
// filter AND a version selector. We therefore resolve explicitly — a skill's
// OWN view (and the runtime read of a user's own skill) uses the LATEST version
// (so in-progress edits show); the GLOBAL/published view uses the ACTIVE version.

// Cache the init+seed step per subdomain as a promise so concurrent first
// touches share one run (no duplicate-named seed skills under a race).
const initializing = new Map<string, Promise<void>>();

/**
 * The skills storage domain for a subdomain, initialised (indexes) and seeded
 * with the global defaults exactly once per process per subdomain.
 */
export const getSkillsStore = async (
  subdomain?: string,
): Promise<SkillsStorage> => {
  const sub = normalizeSubdomain(subdomain);
  const store = await getMastraStore(sub);
  const skills = (await store.getStore('skills')) as SkillsStorage | undefined;
  if (!skills) {
    throw new Error('Mastra skills storage domain is unavailable');
  }
  let init = initializing.get(sub);
  if (!init) {
    init = (async () => {
      await skills.init();
      await ensureSeedSkills(sub, skills);
    })().catch((err) => {
      initializing.delete(sub); // allow a later retry if init failed
      throw err;
    });
    initializing.set(sub, init);
  }
  await init;
  return skills;
};

/**
 * Resolve a skill (record + version) scoped to the subdomain.
 *  - resolution 'latest'  → newest version (owner edit/preview, own-skill runtime)
 *  - resolution 'active'  → published version (global runtime, public view)
 */
export const getScopedResolved = async (
  subdomain: string,
  id: string,
  resolution: 'latest' | 'active' = 'latest',
): Promise<StorageResolvedSkillType | null> => {
  const skills = await getSkillsStore(subdomain);
  const resolved = await skills.getByIdResolved(id, {
    status: resolution === 'latest' ? 'draft' : 'published',
  });
  if (!resolved || !belongsToSubdomain(resolved, subdomain)) return null;
  return resolved;
};

/** Create a skill (draft, version 1). authorId carries subdomain + owner. */
export const createScopedSkill = async (
  subdomain: string,
  ownerId: string,
  content: ISkillContent,
  visibility: StorageVisibility = 'private',
): Promise<StorageResolvedSkillType> => {
  validateSkillContent(content);
  const skills = await getSkillsStore(subdomain);
  const id = newSkillId(subdomain);
  await skills.create({
    skill: {
      id,
      authorId: encodeAuthorId(subdomain, ownerId),
      visibility,
      name: content.name,
      description: content.description,
      instructions: content.instructions,
      metadata: buildSnapshotMetadata(subdomain, content),
    },
  });
  const resolved = await getScopedResolved(subdomain, id, 'latest');
  if (!resolved) throw new Error('Skill creation failed');
  return resolved;
};

/**
 * Append a new version with updated content. Caller has already verified
 * ownership/tenancy via getScopedResolved.
 */
export const updateScopedContent = async (
  subdomain: string,
  id: string,
  content: ISkillContent,
): Promise<StorageResolvedSkillType | null> => {
  validateSkillContent(content);
  const skills = await getSkillsStore(subdomain);
  await skills.update({
    id,
    name: content.name,
    description: content.description,
    instructions: content.instructions,
    metadata: buildSnapshotMetadata(subdomain, content),
  });
  return getScopedResolved(subdomain, id, 'latest');
};

/** Move record-level fields (status/visibility/activeVersionId/authorId). */
export const updateScopedRecord = async (
  subdomain: string,
  id: string,
  patch: {
    status?: SkillStatus;
    visibility?: StorageVisibility;
    activeVersionId?: string;
    authorId?: string;
  },
  resolution: 'latest' | 'active' = 'active',
): Promise<StorageResolvedSkillType | null> => {
  const skills = await getSkillsStore(subdomain);
  await skills.update({ id, ...patch });
  return getScopedResolved(subdomain, id, resolution);
};

/** Delete a skill and all its versions (tenancy already verified by caller). */
export const deleteScopedSkill = async (
  subdomain: string,
  id: string,
): Promise<void> => {
  const skills = await getSkillsStore(subdomain);
  await skills.delete(id);
};

/**
 * All skills authored by one owner in this subdomain (any status), each resolved
 * with its LATEST version so in-progress edits are visible. Newest first.
 */
export const listOwnedLatest = async (
  subdomain: string,
  ownerId: string,
): Promise<StorageResolvedSkillType[]> => {
  const skills = await getSkillsStore(subdomain);
  const res = await skills.list({
    authorId: encodeAuthorId(subdomain, ownerId),
    perPage: false,
  });
  const records = res.skills.filter((s) => belongsToSubdomain(s, subdomain));
  const resolved = await Promise.all(
    records.map((r) => skills.getByIdResolved(r.id, { status: 'draft' })),
  );
  return resolved.filter(
    (s): s is StorageResolvedSkillType => !!s && belongsToSubdomain(s, subdomain),
  );
};

/**
 * A user's OWN published skills (status published), resolved with their ACTIVE
 * version — the runtime view of a user's personal skills. Drafts are excluded
 * (they stay preview-only until published).
 */
export const listOwnedPublished = async (
  subdomain: string,
  ownerId: string,
): Promise<StorageResolvedSkillType[]> => {
  const skills = await getSkillsStore(subdomain);
  const res = await skills.list({
    authorId: encodeAuthorId(subdomain, ownerId),
    status: 'published',
    perPage: false,
  });
  const records = res.skills.filter((s) => belongsToSubdomain(s, subdomain));
  const resolved = await Promise.all(
    records.map((r) => skills.getByIdResolved(r.id, { status: 'published' })),
  );
  return resolved.filter(
    (s): s is StorageResolvedSkillType => !!s && belongsToSubdomain(s, subdomain),
  );
};

/**
 * The subdomain's published global skills (public, active). Global = ANY public
 * published skill in the subdomain, NOT only system-authored ones: a promoted
 * skill keeps its original author (so the author can still manage/demote it),
 * so filtering by systemAuthorId here would hide author-promoted skills.
 *
 * Tenancy is enforced by the belongsToSubdomain post-filter. This scan is NOT
 * subdomain-scoped at the query layer: globals span many authorIds (seeds use
 * systemAuthorId, promoted skills keep their author), and the thin skill record
 * the storage `list()` filters on persists only id/status/visibility/authorId —
 * subdomain lives in the version snapshot, which `list()` cannot filter on (see
 * tenancy.ts). So `listResolved({ visibility:'public', status:'published' })`
 * returns every tenant's public skills and we drop foreign ones here. Cost grows
 * with the cross-tenant count of promoted+seed publics (user-generated, so NOT
 * bounded as the seed-only assumption implied). Query-layer scoping needs a
 * denormalized, queryable subdomain field on the record itself — a storage-schema
 * change the vendored @mastra skills domain does not currently support.
 */
export const listScopedGlobal = async (
  subdomain: string,
): Promise<StorageResolvedSkillType[]> => {
  const skills = await getSkillsStore(subdomain);
  const res = await skills.listResolved({
    visibility: 'public',
    status: 'published',
    perPage: false,
  });
  return res.skills.filter((s) => belongsToSubdomain(s, subdomain));
};
