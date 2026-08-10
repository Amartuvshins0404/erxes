export interface IMastraAgent {
  _id: string;
  accountName: string;
  accountDescription?: string | null;
  createdBy?: string | null;
  visibility: 'private' | 'shared' | 'organization';
  audienceUserIds: string[];
  permissionGroupIds: string[];
  instructions?: string | null;
  provider?: string | null;
  model?: string | null;
  additionalTools?: string[] | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMastraAgentResponse {
  mastraAgent: IMastraAgent | null;
}
