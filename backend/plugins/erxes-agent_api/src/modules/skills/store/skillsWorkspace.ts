import { Workspace } from '@mastra/core/workspace';
import { ErxesMongoSkillSource } from '@/skills/store/skillSource';
import { resolveRequestSkills } from '@/skills/store/resolveSkills';
import { normalizeSubdomain } from '@/skills/store/tenancy';

// Builds the per-(subdomain, agent-allowlist) Mastra Workspace the agent reads
// skills through. Minimal footprint: a custom Mongo-backed skillSource and a
// dynamic `skills` resolver — NO filesystem, sandbox, blob store or search
// engine. Passing this `workspace` to `new Agent({...})` makes Mastra auto-wire
// the SkillsProcessor (injects name+description into the system prompt) and the
// skill / skill_search / skill_read tools (progressive disclosure).

export const getSkillsWorkspace = (
  subdomain: string,
  globs: string[],
): Workspace => {
  const source = new ErxesMongoSkillSource(subdomain, globs);
  return new Workspace({
    id: `erxes-skills-${normalizeSubdomain(subdomain)}`,
    skillSource: source,
    // Return one direct skill-dir path per allowed skill. WorkspaceSkills treats
    // each `/<name>` as a direct skill (loads `/<name>/SKILL.md` from the source).
    skills: async () =>
      (await resolveRequestSkills(subdomain, globs)).map((s) => `/${s.name}`),
  });
};
