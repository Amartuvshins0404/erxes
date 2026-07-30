export interface IMastraAgent {
  _id: string;
  accountName: string;
  accountDescription?: string | null;
  permissionGroupIds: string[];
  instructions?: string | null;
  provider?: string | null;
  model?: string | null;
  skills?: string[] | null;
  destructiveOps?: 'allow' | 'ask' | null;
  memoryEnabled?: boolean | null;
  debug?: boolean | null;
  maxSteps?: number | null;
  temperature?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMastraAgentResponse {
  mastraAgent: IMastraAgent | null;
}
