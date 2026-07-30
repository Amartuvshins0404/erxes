import { Document } from 'mongoose';

export interface IAgentServer {
  identifierId?: string;
  name: string;
  url: string;
  token: string;
  approveCode: string;

  agentId: string;
  serverId: string;
  transferredFromSubdomain?: string;
  transferredAt?: Date;

  status: string;
  provisioning?: {
    stage?: string;
    message?: string;
    startedAt?: Date;
    updatedAt?: Date;
    error?: string;
  };
}

export interface IAgentServerDocument extends IAgentServer, Document {
  _id: string;

  createdAt: Date;
  updatedAt: Date;
}
