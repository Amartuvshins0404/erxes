import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { IBaMembershipPlanDocument } from '@/membership/@types/membershipPlan';

export const baMembershipPlanSchema = new Schema<IBaMembershipPlanDocument>(
  {
    _id: mongooseStringRandomId,
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    currency: { type: String, default: 'MNT' },
    durationMonths: { type: Number, required: true, default: 12 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
