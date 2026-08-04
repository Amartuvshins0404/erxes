import { Document, Model } from 'mongoose';

export interface IMastraSandboxSession {
  agentId: string;
  threadId: string;
  sandboxId?: string;
  expiresAt?: Date;
  leaseId?: string;
  leaseExpiresAt?: Date;
}

export interface IMastraSandboxSessionDocument
  extends IMastraSandboxSession,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IMastraSandboxSessionModel = Model<IMastraSandboxSessionDocument>;
