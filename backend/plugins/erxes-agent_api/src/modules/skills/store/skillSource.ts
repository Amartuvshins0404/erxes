import type {
  SkillSource,
  SkillSourceEntry,
  SkillSourceStat,
} from '@mastra/core/workspace';
import { getCurrentAuth } from '~/mastra/requestContext';
import { resolveRequestSkills } from '@/skills/store/resolveSkills';
import { serializeSkillMd } from '@/skills/store/skillContent';

// A thin, read-only SkillSource that serves a virtual filesystem from the
// Mongo-backed skills store — NO BlobStore, NO search engine (instructions-only).
// Each resolved skill is mounted as `/<name>/SKILL.md`, reconstructed from its
// stored version snapshot. The source is bound to one (subdomain, agentGlobs)
// and resolves the request's allowed skills via the SAME resolveRequestSkills the
// workspace `skills` resolver uses, reading the user from getCurrentAuth() — so
// source and resolver always agree. A short per-request cache coalesces the many
// exists/stat/readFile calls a single discovery pass makes.

interface CachedSkill {
  content: string;
  updatedAt: Date;
}

const CACHE_TTL_MS = 1500;

export class ErxesMongoSkillSource implements SkillSource {
  readonly #subdomain: string;
  readonly #globs: string[];
  #cache?: { userId: string; at: number; map: Map<string, CachedSkill> };

  constructor(subdomain: string, globs: string[]) {
    this.#subdomain = subdomain;
    this.#globs = globs;
  }

  async #resolved(): Promise<Map<string, CachedSkill>> {
    const userId = getCurrentAuth()?.userId ?? '';
    const now = Date.now();
    if (
      this.#cache &&
      this.#cache.userId === userId &&
      now - this.#cache.at < CACHE_TTL_MS
    ) {
      return this.#cache.map;
    }
    const skills = await resolveRequestSkills(this.#subdomain, this.#globs);
    const map = new Map<string, CachedSkill>();
    for (const skill of skills) {
      map.set(skill.name, {
        content: serializeSkillMd(skill),
        updatedAt: skill.updatedAt ?? new Date(),
      });
    }
    this.#cache = { userId, at: now, map };
    return map;
  }

  /** Normalize to `[]` (root), `[name]`, or `[name, 'SKILL.md']` (or deeper). */
  #segments(path: string): string[] {
    return path.split('/').filter(Boolean);
  }

  async exists(path: string): Promise<boolean> {
    const seg = this.#segments(path);
    if (seg.length === 0) return true; // virtual root
    const map = await this.#resolved();
    if (seg.length === 1) return map.has(seg[0]);
    if (seg.length === 2 && seg[1] === 'SKILL.md') return map.has(seg[0]);
    return false; // references/scripts/assets and anything deeper don't exist
  }

  async stat(path: string): Promise<SkillSourceStat> {
    const seg = this.#segments(path);
    const map = await this.#resolved();
    if (seg.length === 0) {
      const now = new Date();
      return { name: '', type: 'directory', size: 0, createdAt: now, modifiedAt: now };
    }
    const skill = map.get(seg[0]);
    if (!skill) throw new Error(`Skill path not found: ${path}`);
    if (seg.length === 1) {
      return {
        name: seg[0],
        type: 'directory',
        size: 0,
        createdAt: skill.updatedAt,
        modifiedAt: skill.updatedAt,
      };
    }
    if (seg.length === 2 && seg[1] === 'SKILL.md') {
      return {
        name: 'SKILL.md',
        type: 'file',
        size: Buffer.byteLength(skill.content),
        mimeType: 'text/markdown',
        createdAt: skill.updatedAt,
        modifiedAt: skill.updatedAt,
      };
    }
    throw new Error(`Skill path not found: ${path}`);
  }

  async readFile(path: string): Promise<string> {
    const seg = this.#segments(path);
    if (seg.length === 2 && seg[1] === 'SKILL.md') {
      const skill = (await this.#resolved()).get(seg[0]);
      if (skill) return skill.content;
    }
    throw new Error(`Skill file not found: ${path}`);
  }

  async readdir(path: string): Promise<SkillSourceEntry[]> {
    const seg = this.#segments(path);
    const map = await this.#resolved();
    if (seg.length === 0) {
      return [...map.keys()].map((name) => ({ name, type: 'directory' }));
    }
    if (seg.length === 1 && map.has(seg[0])) {
      return [{ name: 'SKILL.md', type: 'file' }];
    }
    return [];
  }

  async realpath(path: string): Promise<string> {
    return path;
  }
}
