export interface IMastraAgentCapabilities {
  canReadConfig: boolean;
  canChat: boolean;
  canEdit: boolean;
  canRemove: boolean;
  canShare: boolean;
  canTransferOwnership: boolean;
  canManageGrant: boolean;
  canReadWorkflows: boolean;
  canReadSkills: boolean;
  canReadLearnings: boolean;
}

export interface IMastraAgent {
  _id: string;
  name: string;
  agentId: string;
  description?: string | null;
  instructions?: string | null;
  provider?: string | null;
  model?: string | null;
  grantGroupId?: string | null;
  skills?: string[] | null;
  destructiveOps?: 'allow' | 'ask' | null;
  memoryEnabled?: boolean | null;
  debug?: boolean | null;
  maxSteps?: number | null;
  temperature?: number | null;
  isEnabled?: boolean | null;
  visibility?: 'private' | 'team' | 'department' | 'unit' | 'org' | null;
  teamId?: string | null;
  departmentId?: string | null;
  unitId?: string | null;
  isOwnAgent?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  capabilities?: IMastraAgentCapabilities | null;
}

export interface IMastraAgentResponse {
  mastraAgent: IMastraAgent | null;
}

export interface IMastraAgentQuotaStatus {
  count: number;
  quota: number;
  atQuota: boolean;
}
