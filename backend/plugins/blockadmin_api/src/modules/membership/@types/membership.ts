import { Document } from 'mongoose';

export interface IBaMembership {
  customerId: string;
  planId?: string;
  status: string;
  startDate: Date;
  endDate: Date;
  amount?: number;
  currency?: string;
  invoiceId?: string;
}

export interface IBaMembershipDocument extends IBaMembership, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
