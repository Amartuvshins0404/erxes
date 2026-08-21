import { Document } from 'mongoose';

export interface ICustomerSync {
  customerId: string;
  blockAdminId: string;
}

export interface ICustomerSyncDocument extends ICustomerSync, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
