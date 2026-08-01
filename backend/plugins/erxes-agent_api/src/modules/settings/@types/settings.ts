import { Document } from 'mongoose';

export interface IMastraSettings {
  erxesApiUrl?: string;
  // Workspace-wide memory switch. Individual agents may opt out separately.
  memoryEnabled?: boolean;
  // Chat file attachments: rides on the instance's existing upload storage
  // (S3/R2/Azure/GCS/local, configured in core). Defaults to on; only
  // effective when that storage is actually configured.
  attachmentsEnabled?: boolean;
}

export interface IMastraSettingsDocument extends IMastraSettings, Document {
  _id: string;
}
