import type { StorageResolvedSkillType } from '@mastra/core/storage';
import { getCurrentAuth } from '~/mastra/requestContext';
import { listOwnedPublished, listScopedGlobal } from '@/skills/store/skillsStore';
import { matchesGlobs, readSnapshotMetadata } from '@/skills/store/skillContent';

// THE single definition of "the skills a user can reach through an agent":
// the agent's glob-matched GLOBAL published skills PLUS the user's OWN published
// skills (the implicit `<userId>/*`). User skills shadow a global skill of the
// same name. Every authorization-relevant caller (the runtime workspace
// resolver, the slash-command picker, slash activation) consumes this one
// function so the visibility semantics can't drift apart.

export interface ReachableSkill {
  skill: StorageResolvedSkillType;
  scope: 'mine' | 'global';
}

export const resolveReachableSkills = async (
  subdomain: string,
  userId: string,
  globs: string[],
  opts: { invocableOnly?: boolean } = {},
): Promise<ReachableSkill[]> => {
  const { invocableOnly = false } = opts;
  const [globals, own] = await Promise.all([
    listScopedGlobal(subdomain),
    userId ? listOwnedPublished(subdomain, userId) : Promise.resolve([]),
  ]);

  const invocable = (s: StorageResolvedSkillType): boolean =>
    !invocableOnly || readSnapshotMetadata(s.metadata).userInvocable;

  // Dedupe by name; insert globals first, then own so the user's own skill
  // overwrites (shadows) a same-named global.
  const byName = new Map<string, ReachableSkill>();
  for (const skill of globals) {
    if (!invocable(skill)) continue;
    const meta = readSnapshotMetadata(skill.metadata);
    if (!matchesGlobs(globs, skill.name, meta.category)) continue;
    byName.set(skill.name, { skill, scope: 'global' });
  }
  for (const skill of own) {
    if (!invocable(skill)) continue;
    byName.set(skill.name, { skill, scope: 'mine' });
  }
  return [...byName.values()];
};

/**
 * Runtime variant for the Workspace skill source / resolver: the current
 * request's reachable skills (all reachable, not just invocable). Reads the
 * user from the request auth context (this runs inside runWithAuth during
 * agent.generate).
 */
export const resolveRequestSkills = async (
  subdomain: string,
  globs: string[],
): Promise<StorageResolvedSkillType[]> => {
  const userId = getCurrentAuth()?.userId ?? '';
  const reachable = await resolveReachableSkills(subdomain, userId, globs);
  return reachable.map((r) => r.skill);
};
