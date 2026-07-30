import { Document } from 'mongoose';

export interface IMushopMembershipPlan {
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMonths: number;
  isActive: boolean;
}

export interface IMushopMembershipPlanDocument
  extends IMushopMembershipPlan,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
