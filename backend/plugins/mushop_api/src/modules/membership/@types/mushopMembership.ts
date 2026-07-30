import { Document } from 'mongoose';

export interface IMushopMembership {
  customerId: string;
  planId?: string;
  status: string;
  startDate: Date;
  endDate: Date;
  amount?: number;
  currency?: string;
  invoiceId?: string;
}

export interface IMushopMembershipDocument
  extends IMushopMembership,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
