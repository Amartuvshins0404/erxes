import { Document } from 'mongoose';

export type MastraAgentVisibility = 'private' | 'shared' | 'organization';
export type MastraAgentPermissionMode = 'delegated' | 'managed';

export interface IMastraAgent {
  instructions?: string;
  provider: string;
  model: string;
  createdBy?: string;
  visibility?: MastraAgentVisibility;
  audienceUserIds?: string[];
  permissionMode?: MastraAgentPermissionMode;
  // Explicit allowlist for optional non-erxes capabilities (web, document,
  // image, and isolated terminal tools). Empty means none.
  additionalTools?: string[];
}

// Account fields accepted by the AI-team-member create/update API. They are
// persisted only on the canonical core User, never duplicated in this profile.
export interface IMastraAgentInput extends Partial<IMastraAgent> {
  name?: string;
  description?: string;
  permissionGroupIds?: string[];
  visibility?: MastraAgentVisibility;
  audienceUserIds?: string[];
  isActive?: boolean;
}

export interface IMastraAgentDocument
  extends IMastraAgent,
    Omit<Document, 'model'> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
