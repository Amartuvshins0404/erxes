import { Document } from 'mongoose';

export type MastraProviderScope = 'organization' | 'personal';

export interface IMastraProvider {
  provider: string;
  label?: string;
  apiKey?: string;
  baseUrl?: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  isOpenAICompatible?: boolean;
  modelsEndpoint?: string;
  envKey?: string;
  headers?: Record<string, string>;
  scope?: MastraProviderScope;
  ownerId?: string | null;
}

export interface IMastraProviderDocument extends IMastraProvider, Document {
  _id: string;
  scope: MastraProviderScope;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
