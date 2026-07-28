import { Document } from 'mongoose';

export interface IMastraAgent {
  name: string;
  agentId: string;
  description?: string;
  instructions?: string;
  provider: string;
  model: string;
  // Skill allowlist: glob patterns matched against global skills' name (or
  // `category/name`), e.g. ['erxes-*', 'sales/*']. The requesting user's own
  // published skills are always included on top. Empty/unset → no skills.
  skills?: string[];
  // Consent for irreversible deletes/merges. 'ask' (default) prompts the user;
  // 'allow' runs without asking. ('block' is a tolerated legacy value → 'ask'.)
  destructiveOps?: 'allow' | 'ask' | 'block';
  memoryEnabled?: boolean;
  // Debug view: surface the full tool-call trace in the chat (default off).
  debug?: boolean;
  maxSteps?: number;
  temperature?: number;
  isEnabled?: boolean;
  createdBy?: string;
  // Agent-as-principal (step 21): the agent's dedicated core "service user" — a
  // passwordless, non-owner, role:'system' user provisioned lazily by
  // ensureServiceUser. Background runs will mint run tokens for it (step 22).
  serviceUserId?: string;
  // The permission group assigned to the service user, carrying the agent's
  // server-side grant. Synced onto the user via syncServiceUserGroup (step 23
  // drives the selection). Unset → no group (empty permissionGroupIds).
  grantGroupId?: string | null;
  // Access control: who can see and chat with this agent.
  visibility?: 'private' | 'team' | 'department' | 'unit' | 'org';
  // teamId stores the branch _id for all scoped modes (team/department/unit) so
  // the edit form can reconstruct the cascade without a reverse-lookup.
  teamId?: string | null;
  departmentId?: string | null;
  unitId?: string | null;
}

export interface IMastraAgentDocument
  extends IMastraAgent,
    Omit<Document, 'model'> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
