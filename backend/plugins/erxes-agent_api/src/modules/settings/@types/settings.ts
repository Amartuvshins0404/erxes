import { Document } from 'mongoose';

export interface IMastraSettings {
  erxesApiUrl?: string;
  erxesApiToken?: string;
  defaultAgentId?: string;
  // Chat file attachments: rides on the instance's existing upload storage
  // (S3/R2/Azure/GCS/local, configured in core). Defaults to on; only
  // effective when that storage is actually configured.
  attachmentsEnabled?: boolean;
  // Per-user agent creation cap. 0 = unlimited. Admins are always exempt.
  defaultAgentQuota?: number;
}

export interface IMastraSettingsDocument extends IMastraSettings, Document {
  _id: string;
}
