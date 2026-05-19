import { Document } from 'mongoose';

export interface IOpencodeServer {
  identifierId?: string;
  name: string;
  url: string;
  token?: string;
  provider: string;
  serverId: string;
  serverPassword?: string;
  status: string;
}

export interface IOpencodeServerDocument extends IOpencodeServer, Document {
  _id: string;

  createdAt: Date;
  updatedAt: Date;
}
