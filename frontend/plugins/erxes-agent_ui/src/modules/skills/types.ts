// Hand-written response/domain types for the skills module — mirrors the locked
// erxes-agent GraphQL contract (no codegen). Kept free of React imports so any
// layer (hooks, components, utils) can depend on it.

export type SkillStatus = 'draft' | 'published' | 'archived';
export type SkillVisibility = 'private' | 'public';
export type SkillScope = 'mine' | 'global' | 'all';

// Arbitrary author metadata round-tripped through the `metadata` JSON scalar.
export type SkillMetadata = Record<string, unknown>;

// A skill resolved with its active (published) or latest (draft) version.
export interface IMastraSkill {
  _id: string;
  name: string;
  description: string;
  instructions?: string | null;
  status: SkillStatus;
  visibility: SkillVisibility;
  userInvocable: boolean;
  category?: string | null;
  metadata?: SkillMetadata | null;
  authorId?: string | null;
  isMine?: boolean | null;
  activeVersionId?: string | null;
  versionCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Lightweight row rendered in the skills management table (no instructions body).
export interface IMastraSkillRow {
  _id: string;
  name: string;
  description: string;
  status: SkillStatus;
  visibility: SkillVisibility;
  userInvocable: boolean;
  category?: string | null;
  isMine?: boolean | null;
  activeVersionId?: string | null;
  versionCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// One version-history row (list view — no instructions body).
export interface IMastraSkillVersionRow {
  _id: string;
  skillId: string;
  versionNumber: number;
  name?: string | null;
  description?: string | null;
  userInvocable?: boolean | null;
  changeMessage?: string | null;
  changedFields?: string[] | null;
  createdAt?: string | null;
}

// A single historical version with its full content (for restore/diff).
export interface IMastraSkillVersion extends IMastraSkillVersionRow {
  instructions?: string | null;
  metadata?: SkillMetadata | null;
}

// Slash-command picker row.
export interface IMastraInvocableSkill {
  name: string;
  description: string;
  scope: 'mine' | 'global';
}

// Result of activating a /slash skill for a turn.
export interface IMastraSkillActivation {
  name: string;
  instructions: string;
}

// ─── Query/mutation response envelopes ──────────────────────────────────────

export interface IMastraSkillsResponse {
  mastraSkills: {
    list: IMastraSkillRow[];
    totalCount: number;
  } | null;
}

export interface IMastraSkillResponse {
  mastraSkill: IMastraSkill | null;
}

export interface IMastraSkillVersionsResponse {
  mastraSkillVersions: IMastraSkillVersionRow[] | null;
}

export interface IMastraSkillVersionResponse {
  mastraSkillVersion: IMastraSkillVersion | null;
}

export interface IMastraInvocableSkillsResponse {
  mastraInvocableSkills: IMastraInvocableSkill[] | null;
}

// ─── Mutation inputs ────────────────────────────────────────────────────────

export interface IMastraSkillCreateInput {
  name: string;
  description: string;
  instructions: string;
  userInvocable?: boolean;
  visibility?: SkillVisibility;
  category?: string;
  metadata?: SkillMetadata;
}

export interface IMastraSkillUpdateInput {
  name?: string;
  description?: string;
  instructions?: string;
  userInvocable?: boolean;
  category?: string;
  metadata?: SkillMetadata;
  changeMessage?: string;
}
