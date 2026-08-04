import { Document } from 'mongoose';

export interface IMastraSettings {
  erxesApiUrl?: string;
  // Workspace-wide memory switch. Individual agents may opt out separately.
  memoryEnabled?: boolean;
  // Chat file attachments: rides on the instance's existing upload storage
  // (S3/R2/Azure/GCS/local, configured in core). Defaults to on; only
  // effective when that storage is actually configured.
  attachmentsEnabled?: boolean;
  // Runtime feature controls. Defaults mirror the previous environment-backed
  // behavior: learning/evaluation off, background removal on, summarizer falls
  // back to each agent's own model.
  learningEnabled?: boolean;
  learningAutoPromoteMinSources?: number;
  learningAutoPromoteMinConfidence?: number;
  learningDigestMaxChars?: number;
  learningDigestMaxEntries?: number;
  learningIdleMinutes?: number;
  learningDecayDays?: number;
  learningDecayFactor?: number;
  learningArchiveBelowConfidence?: number;
  evaluationEnabled?: boolean;
  evaluationDsn?: string;
  backgroundRemovalEnabled?: boolean;
  summarizerProvider?: string;
  summarizerModel?: string;
  // OpenSandbox connection used by the optional per-agent terminal tool.
  // The API key is write-only at the GraphQL boundary.
  openSandboxApiUrl?: string;
  openSandboxApiKey?: string;
}

export interface IMastraSettingsDocument extends IMastraSettings, Document {
  _id: string;
}
