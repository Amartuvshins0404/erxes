import { Document } from 'mongoose';

export interface IBaMembershipPlan {
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMonths: number;
  isActive: boolean;
}

export interface IBaMembershipPlanDocument
  extends IBaMembershipPlan,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
