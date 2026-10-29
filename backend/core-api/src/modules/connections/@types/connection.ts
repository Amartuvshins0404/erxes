import { Document } from 'mongoose';

export type ConnectionScope = 'workspace' | 'personal';

export interface IConnection {
  type: string;
  name: string;
  scope: ConnectionScope;
  ownerId?: string;
  config: Record<string, unknown>;
  secrets: Record<string, string>;
  services: string[];
  createdBy?: string;
  updatedBy?: string;
}

export interface IConnectionDocument extends IConnection, Document {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConnectionAddInput {
  type: string;
  name: string;
  scope?: string;
  config?: unknown;
  secrets?: unknown;
  services?: string[];
}

export interface IConnectionEditInput {
  name?: string;
  config?: unknown;
  secrets?: unknown;
  services?: string[];
}
