import { Document } from 'mongoose';

export interface IMastraSettings {
  erxesApiUrl?: string;
  // Workspace-wide memory switch shared by every agent.
  memoryEnabled?: boolean;
  // Chat file attachments: rides on the instance's existing upload storage
  // (S3/R2/Azure/GCS/local, configured in core). Defaults to on; only
  // effective when that storage is actually configured.
  attachmentsEnabled?: boolean;
  backgroundRemovalEnabled?: boolean;
  // OpenSandbox connection used by the optional per-agent terminal tool.
  // The API key is write-only at the GraphQL boundary.
  openSandboxApiUrl?: string;
  openSandboxApiKey?: string;
}

export interface IMastraSettingsDocument extends IMastraSettings, Document {
  _id: string;
}
