import { Document } from 'mongoose';

export interface IAgentsUserPreferences {
  userId: string;
  defaultConnectionId?: string;
}

export interface IAgentsUserPreferencesDocument
  extends IAgentsUserPreferences,
    Document {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
}
