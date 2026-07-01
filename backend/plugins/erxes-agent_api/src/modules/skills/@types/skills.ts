// Domain types for the agent "skills" feature. Skills are native Mastra skills
// (SKILL.md) persisted through @mastra/mongodb's MongoDBSkillsStorage and read by
// the agent via a Workspace + SkillsProcessor. These interfaces are the
// erxes-facing shapes (resolvers, tools, service) — they decode the storage
// records into flat objects and never expose the subdomain-namespaced ids.

export type SkillStatus = 'draft' | 'published' | 'archived';
export type SkillVisibility = 'private' | 'public';

/** List scope for the GraphQL `mastraSkills` query. */
export type SkillScope = 'mine' | 'global' | 'all';

/** A skill resolved with the content of its active (published) or latest (draft) version. */
export interface IMastraSkill {
  _id: string;
  name: string;
  description: string;
  instructions?: string;
  status: SkillStatus;
  visibility: SkillVisibility;
  userInvocable: boolean;
  category?: string;
  metadata?: Record<string, unknown>;
  /** Decoded owner: the erxes user `_id`, or `system` for global skills. */
  authorId?: string;
  /** True when the requesting user owns this skill. */
  isMine?: boolean;
  activeVersionId?: string;
  versionCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** One stored version snapshot of a skill. */
export interface IMastraSkillVersion {
  _id: string;
  skillId: string;
  versionNumber: number;
  name?: string;
  description?: string;
  instructions?: string;
  userInvocable?: boolean;
  metadata?: Record<string, unknown>;
  changeMessage?: string;
  changedFields?: string[];
  createdAt?: Date;
}

/** Lightweight row for the slash-command composer picker. */
export interface IMastraInvocableSkill {
  name: string;
  description: string;
  scope: 'mine' | 'global';
}

/** Content fields shared by create/update and the makeSkill distiller. */
export interface ISkillContent {
  name: string;
  description: string;
  instructions: string;
  userInvocable?: boolean;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface ISkillCreateInput extends ISkillContent {
  visibility?: SkillVisibility;
}

export interface ISkillUpdateInput extends Partial<ISkillContent> {
  changeMessage?: string;
}

export interface ISkillListParams {
  scope?: SkillScope;
  status?: SkillStatus;
  searchValue?: string;
  page?: number;
  perPage?: number;
}

export interface ISkillListResult {
  list: IMastraSkill[];
  totalCount: number;
}
