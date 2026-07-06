import { Document } from 'mongoose';

export const ORDER_STATUS = {
  PENDING: 'pending',
  FORWARDED: 'forwarded',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  ALL: ['pending', 'forwarded', 'cancelled', 'failed'],
};

export interface IOrder {
  subdomain?: string;
  posToken?: string;
  order?: any;
  status?: string;
  entityId?: string | null;
  customerId?: string | null;
  error?: string | null;
}

export interface IOrderDocument extends IOrder, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
