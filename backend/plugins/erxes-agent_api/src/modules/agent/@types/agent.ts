import { Document } from 'mongoose';

export interface IMastraAgent {
  instructions?: string;
  provider: string;
  model: string;
  // Skill allowlist: glob patterns matched against global skills' name (or
  // `category/name`), e.g. ['erxes-*', 'sales/*']. Empty/unset → no skills.
  skills?: string[];
  // Consent for irreversible deletes/merges. 'ask' (default) prompts the user;
  // 'allow' runs without asking. ('block' is a tolerated legacy value → 'ask'.)
  destructiveOps?: 'allow' | 'ask' | 'block';
  memoryEnabled?: boolean;
  // Debug view: surface the full tool-call trace in chat (default off).
  debug?: boolean;
  maxSteps?: number;
  temperature?: number;
}

// Account fields accepted by the AI-team-member create/update API. They are
// persisted only on the canonical core User, never duplicated in this profile.
export interface IMastraAgentInput extends Partial<IMastraAgent> {
  name?: string;
  description?: string;
  permissionGroupIds?: string[];
  isActive?: boolean;
}

export interface IMastraAgentDocument
  extends IMastraAgent,
    Omit<Document, 'model'> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
