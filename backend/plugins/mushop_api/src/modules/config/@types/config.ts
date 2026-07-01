import { Document } from 'mongoose';

export interface IMushopConfig {
  // Stable identifier for the setting, e.g. "yenToMntRate".
  code: string;
  value?: number;
}

export interface IMushopConfigDocument extends IMushopConfig, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
