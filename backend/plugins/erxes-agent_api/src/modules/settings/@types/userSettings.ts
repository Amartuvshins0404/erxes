import { Document } from 'mongoose';

export interface IMastraUserSettings {
  userId: string;
  agentQuota?: number; // undefined = inherit defaultAgentQuota from MastraSettings
}

export interface IMastraUserSettingsDocument
  extends IMastraUserSettings,
    Document {
  _id: string;
}
