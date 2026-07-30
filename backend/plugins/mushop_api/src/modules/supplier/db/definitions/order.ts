import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { IOrderDocument, ORDER_STATUS } from '@/supplier/@types/order';

export const orderSchema = new Schema<IOrderDocument>(
  {
    _id: mongooseStringRandomId,
    subdomain: { type: String, index: true },
    posToken: { type: String },
    order: { type: Object },
    status: {
      type: String,
      enum: ORDER_STATUS.ALL,
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    entityId: { type: String, default: null, index: true },
    customerId: { type: String, default: null, index: true },
    error: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);
