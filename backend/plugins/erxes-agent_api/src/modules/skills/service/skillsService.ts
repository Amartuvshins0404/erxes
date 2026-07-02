import { ExpectedError } from 'erxes-api-shared/utils';
import type { StorageResolvedSkillType } from '@mastra/core/storage';
import type { SkillVersion } from '@mastra/core/storage/domains/skills';
import {
  IMastraInvocableSkill,
  IMastraSkill,
  IMastraSkillVersion,
  ISkillCreateInput,
  ISkillListResult,
  ISkillUpdateInput,
  SkillScope,
  SkillStatus,
} from '@/skills/@types/skills';
import {
  createScopedSkill,
  deleteScopedSkill,
  getScopedResolved,
  getSkillsStore,
  listOwnedLatest,
  listScopedGlobal,
  updateScopedContent,
  updateScopedRecord,
} from '@/skills/store/skillsStore';
import { readSnapshotMetadata } from '@/skills/store/skillContent';
import { decodeAuthorId } from '@/skills/store/tenancy';
import { resolveReachableSkills } from '@/skills/store/resolveSkills';

// High-level skill operations shared by the GraphQL resolvers and the makeSkill
// tool. Decodes storage records into erxes-facing IMastraSkill objects, enforces
// per-user ownership for writes, and applies read scoping (own + public). The
// raw subdomain-scoping/tenancy lives in the store layer.

const decodeSkill = (
  subdomain: string,
  resolved: StorageResolvedSkillType,
  requesterId?: string,
): IMastraSkill => {
  const meta = readSnapshotMetadata(resolved.metadata);
  const ownerId = decodeAuthorId(resolved.authorId, subdomain);
  return {
    _id: resolved.id,
    name: resolved.name,
    description: resolved.description,
    instructions: resolved.instructions,
    status: (resolved.status ?? 'draft') as SkillStatus,
    visibility: resolved.visibility === 'public' ? 'public' : 'private',
    userInvocable: meta.userInvocable,
    category: meta.category,
    metadata: meta.data,
    authorId: ownerId,
    isMine: !!requesterId && ownerId === requesterId,
    activeVersionId: resolved.activeVersionId,
    createdAt: resolved.createdAt,
    updatedAt: resolved.updatedAt,
  };
};

const decodeVersion = (version: SkillVersion): IMastraSkillVersion => {
  const meta = readSnapshotMetadata(version.metadata);
  return {
    _id: version.id,
    skillId: version.skillId,
    versionNumber: version.versionNumber,
    name: version.name,
    description: version.description,
    instructions: version.instructions,
    userInvocable: meta.userInvocable,
    metadata: meta.data,
    changeMessage: version.changeMessage,
    changedFields: version.changedFields,
    createdAt: version.createdAt,
  };
};

const isOwner = (skill: IMastraSkill, requesterId: string): boolean =>
  skill.authorId === requesterId;

const canRead = (skill: IMastraSkill): boolean =>
  !!skill.isMine || skill.visibility === 'public';

/** Owned skill resolved at its latest version, or a "not found" error. */
const requireOwned = async (
  subdomain: string,
  requesterId: string,
  id: string,
): Promise<IMastraSkill> => {
  const resolved = await getScopedResolved(subdomain, id, 'latest');
  const skill = resolved && decodeSkill(subdomain, resolved, requesterId);
  if (!skill || !isOwner(skill, requesterId)) {
    throw new ExpectedError('Skill not found');
  }
  return skill;
};

/**
 * Owned-OR-admin skill resolved at its latest version, or a "not found" error.
 * Like requireOwned but also lets a skills admin manage a skill they don't
 * author (seeds, other users' promoted globals). A non-owner non-admin still
 * gets "not found" (no existence leak) — so this never loosens access to
 * another user's PRIVATE skill.
 */
const requireManageable = async (
  subdomain: string,
  requesterId: string,
  isAdmin: boolean,
  id: string,
): Promise<IMastraSkill> => {
  const resolved = await getScopedResolved(subdomain, id, 'latest');
  const skill = resolved && decodeSkill(subdomain, resolved, requesterId);
  if (!skill || (!isOwner(skill, requesterId) && !isAdmin)) {
    throw new ExpectedError('Skill not found');
  }
  return skill;
};

export const listSkills = async (
  subdomain: string,
  requesterId: string,
  params: {
    scope?: SkillScope;
    status?: SkillStatus;
    searchValue?: string;
    page?: number;
    perPage?: number;
  },
): Promise<ISkillListResult> => {
  const scope = params.scope ?? 'all';
  const [mine, global] = await Promise.all([
    scope === 'global'
      ? Promise.resolve([] as StorageResolvedSkillType[])
      : listOwnedLatest(subdomain, requesterId),
    scope === 'mine'
      ? Promise.resolve([] as StorageResolvedSkillType[])
      : listScopedGlobal(subdomain),
  ]);

  const byId = new Map<string, IMastraSkill>();
  for (const r of global) byId.set(r.id, decodeSkill(subdomain, r, requesterId));
  for (const r of mine) byId.set(r.id, decodeSkill(subdomain, r, requesterId));

  let all = [...byId.values()];
  if (params.status) all = all.filter((s) => s.status === params.status);
  if (params.searchValue) {
    const q = params.searchValue.toLowerCase();
    all = all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }
  all.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));

  const totalCount = all.length;
  const page = Math.max(params.page ?? 1, 1);
  const perPage = Math.min(Math.max(params.perPage ?? 30, 1), 100);
  const list = all.slice((page - 1) * perPage, (page - 1) * perPage + perPage);
  return { list, totalCount };
};

export const getSkill = async (
  subdomain: string,
  requesterId: string,
  id: string,
): Promise<IMastraSkill> => {
  const resolved = await getScopedResolved(subdomain, id, 'latest');
  const skill = resolved && decodeSkill(subdomain, resolved, requesterId);
  if (!skill || !canRead(skill)) {
    throw new ExpectedError('Skill not found');
  }
  // Non-owners only ever see PUBLISHED (active) content — never draft. A public
  // record that was never published is treated as not found rather than leaking
  // its draft instructions.
  if (!skill.isMine) {
    if (skill.status !== 'published') {
      throw new ExpectedError('Skill not found');
    }
    const active = await getScopedResolved(subdomain, id, 'active');
    if (!active) throw new ExpectedError('Skill not found');
    return decodeSkill(subdomain, active, requesterId);
  }
  return skill;
};

export const listSkillVersions = async (
  subdomain: string,
  requesterId: string,
  skillId: string,
  page = 1,
  perPage = 30,
): Promise<IMastraSkillVersion[]> => {
  // Read gate: only owners and public skills expose history.
  const skill = await getSkill(subdomain, requesterId, skillId);
  const skills = await getSkillsStore(subdomain);
  // Non-owners only ever see the published/active version, never drafts.
  // updateScopedContent appends new versions without advancing activeVersionId,
  // so the full history would leak unpublished work-in-progress (v2+) of a
  // public skill — mirror the same gate getSkill enforces for the content path.
  if (!skill.isMine) {
    if (!skill.activeVersionId) return [];
    const active = await skills.getVersion(skill.activeVersionId);
    return active ? [decodeVersion(active)] : [];
  }
  const res = await skills.listVersions({
    skillId,
    page: Math.max(page - 1, 0),
    perPage: Math.min(Math.max(perPage, 1), 100),
    orderBy: { field: 'versionNumber', direction: 'DESC' },
  });
  return res.versions.map(decodeVersion);
};

export const getSkillVersion = async (
  subdomain: string,
  requesterId: string,
  versionId: string,
): Promise<IMastraSkillVersion> => {
  const skills = await getSkillsStore(subdomain);
  const version = await skills.getVersion(versionId);
  if (!version) throw new ExpectedError('Skill version not found');
  // Read gate via the parent skill (also enforces tenancy).
  const skill = await getSkill(subdomain, requesterId, version.skillId);
  // Non-owners may only read the active/published version — any other version
  // (drafts appended after publish) is hidden exactly as getSkill hides them.
  if (!skill.isMine && version.id !== skill.activeVersionId) {
    throw new ExpectedError('Skill version not found');
  }
  return decodeVersion(version);
};

export const listInvocableSkills = async (
  subdomain: string,
  requesterId: string,
  agentGlobs: string[],
): Promise<IMastraInvocableSkill[]> => {
  const reachable = await resolveReachableSkills(
    subdomain,
    requesterId,
    agentGlobs,
    { invocableOnly: true },
  );
  return reachable
    .map(({ skill, scope }) => ({
      name: skill.name,
      description: skill.description,
      scope,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/** Find an invocable skill by name within the user's reachable set; return its instructions. */
export const activateInvocableSkill = async (
  subdomain: string,
  requesterId: string,
  agentGlobs: string[],
  name: string,
): Promise<{ name: string; instructions: string }> => {
  const reachable = await resolveReachableSkills(
    subdomain,
    requesterId,
    agentGlobs,
    { invocableOnly: true },
  );
  const hit = reachable.find((r) => r.skill.name === name);
  if (!hit) {
    throw new ExpectedError(`Skill "${name}" is not available`);
  }
  return { name: hit.skill.name, instructions: hit.skill.instructions ?? '' };
};

/**
 * Build the forced system block for skills the user EXPLICITLY activated for a
 * turn via the slash picker. The native SkillsProcessor injects only Level-1
 * metadata (name + description) and leaves loading the full instructions to the
 * model (it must CALL the `skill` tool). But an explicit slash-activation is a
 * user decision the model shouldn't be able to ignore — so we force-load the
 * full instructions into the turn (passed to agent.stream as `system`) instead
 * of hoping the model calls the tool. Names resolve through the SAME reachable
 * set the picker uses, so a crafted/foreign name can't load instructions the
 * user can't reach. Returns undefined when no name resolves (or none given) —
 * the common no-skill turn never touches the store.
 */
export const buildActivatedSkillsBlock = async (
  subdomain: string,
  requesterId: string,
  agentGlobs: string[],
  names: string[],
): Promise<{ instructions: string; names: string[] } | undefined> => {
  const wanted = new Set(names.filter((n) => typeof n === 'string' && n));
  if (!wanted.size) return undefined;
  const reachable = await resolveReachableSkills(
    subdomain,
    requesterId,
    agentGlobs,
    { invocableOnly: true },
  );
  const hits = reachable.filter((r) => wanted.has(r.skill.name));
  if (!hits.length) return undefined;
  const sections = hits.map(
    ({ skill }) => `## ${skill.name}\n\n${(skill.instructions ?? '').trim()}`,
  );
  return {
    instructions: [
      'The user explicitly activated the following skill(s) for THIS message. Their instructions are mandatory for this turn and take precedence over your general guidance — follow them exactly.',
      '',
      ...sections,
    ].join('\n'),
    names: hits.map(({ skill }) => skill.name),
  };
};

export const createSkill = async (
  subdomain: string,
  ownerId: string,
  input: ISkillCreateInput,
): Promise<IMastraSkill> => {
  // Content is validated at the store write layer (createScopedSkill).
  // Creating a PUBLIC skill directly is a promotion — gated at the resolver
  // (skillsPromote). Default is a private draft authored by the user.
  const visibility = input.visibility === 'public' ? 'public' : 'private';
  // The creator always OWNS the record — even a directly-created public skill —
  // so the author can manage (edit/demote/remove) it afterwards. "Global" is a
  // visibility flag, not a change of ownership.
  const resolved = await createScopedSkill(subdomain, ownerId, input, visibility);
  return decodeSkill(subdomain, resolved, ownerId);
};

export const updateSkill = async (
  subdomain: string,
  requesterId: string,
  id: string,
  input: ISkillUpdateInput,
): Promise<IMastraSkill> => {
  const current = await requireOwned(subdomain, requesterId, id);
  const merged = {
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    instructions: input.instructions ?? current.instructions ?? '',
    userInvocable: input.userInvocable ?? current.userInvocable,
    category: input.category ?? current.category,
    metadata: input.metadata ?? current.metadata,
  };
  // Content is validated at the store write layer (updateScopedContent).
  const resolved = await updateScopedContent(subdomain, id, merged);
  if (!resolved) throw new ExpectedError('Skill not found');
  return decodeSkill(subdomain, resolved, requesterId);
};

export const removeSkill = async (
  subdomain: string,
  requesterId: string,
  id: string,
  isAdmin = false,
): Promise<{ ok: number }> => {
  await requireManageable(subdomain, requesterId, isAdmin, id);
  await deleteScopedSkill(subdomain, id);
  return { ok: 1 };
};

export const publishSkill = async (
  subdomain: string,
  requesterId: string,
  id: string,
): Promise<IMastraSkill> => {
  await requireOwned(subdomain, requesterId, id);
  const skills = await getSkillsStore(subdomain);
  const latest = await skills.getLatestVersion(id);
  if (!latest) throw new ExpectedError('Skill has no version to publish');
  const resolved = await updateScopedRecord(
    subdomain,
    id,
    { status: 'published', activeVersionId: latest.id },
    'active',
  );
  if (!resolved) throw new ExpectedError('Skill not found');
  return decodeSkill(subdomain, resolved, requesterId);
};

export const activateSkillVersion = async (
  subdomain: string,
  requesterId: string,
  id: string,
  versionId: string,
): Promise<IMastraSkill> => {
  await requireOwned(subdomain, requesterId, id);
  const skills = await getSkillsStore(subdomain);
  const version = await skills.getVersion(versionId);
  if (!version || version.skillId !== id) {
    throw new ExpectedError('Skill version not found');
  }
  const resolved = await updateScopedRecord(
    subdomain,
    id,
    { status: 'published', activeVersionId: versionId },
    'active',
  );
  if (!resolved) throw new ExpectedError('Skill not found');
  return decodeSkill(subdomain, resolved, requesterId);
};

/**
 * Promote the requester's OWN already-published skill to a GLOBAL one (visibility
 * public). The skill KEEPS its author — promotion only flips the visibility flag,
 * so the author can still manage and later demote it (see demoteSkill). The
 * resolver additionally gates this with the skillsPromote permission. Requiring
 * ownership prevents promoting another user's private draft without consent, and
 * requiring `published` prevents shipping a never-published draft straight to the
 * global set.
 */
export const promoteSkill = async (
  subdomain: string,
  requesterId: string,
  id: string,
): Promise<IMastraSkill> => {
  const current = await requireOwned(subdomain, requesterId, id);
  if (current.status !== 'published' || !current.activeVersionId) {
    throw new ExpectedError('Only a published skill can be promoted to global');
  }
  // Promote the ALREADY-PUBLISHED (active) version global — not the latest
  // draft, which may be an unpublished work-in-progress ahead of it. authorId is
  // intentionally NOT changed: the author stays the owner.
  const promoted = await updateScopedRecord(
    subdomain,
    id,
    {
      status: 'published',
      visibility: 'public',
      activeVersionId: current.activeVersionId,
    },
    'active',
  );
  if (!promoted) throw new ExpectedError('Skill not found');
  return decodeSkill(subdomain, promoted, requesterId);
};

/**
 * Demote a GLOBAL skill back to its author's PRIVATE scope — the inverse of
 * promoteSkill. Only the visibility flag flips (public → private); the skill
 * keeps its author and its published active version, so it simply leaves the
 * global set and is again visible only to its owner. Gated author-OR-admin: an
 * admin can demote a skill they don't author (e.g. a seed or another user's
 * promoted global); a non-owner non-admin gets "not found".
 */
export const demoteSkill = async (
  subdomain: string,
  requesterId: string,
  id: string,
  isAdmin = false,
): Promise<IMastraSkill> => {
  const current = await requireManageable(subdomain, requesterId, isAdmin, id);
  if (current.visibility !== 'public') {
    throw new ExpectedError('Only a global skill can be demoted');
  }
  const demoted = await updateScopedRecord(
    subdomain,
    id,
    { visibility: 'private' },
    'active',
  );
  if (!demoted) throw new ExpectedError('Skill not found');
  return decodeSkill(subdomain, demoted, requesterId);
};
