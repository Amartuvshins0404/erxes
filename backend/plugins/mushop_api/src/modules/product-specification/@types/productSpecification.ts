import { Document } from 'mongoose';

export interface IMushopProductSpecification {
  productId?: string;
  code?: string;
  moq?: number;
  cnyCost?: number;
  profitPercent?: number;
  prepaymentPercent?: number;
}

export interface IMushopProductSpecificationDocument
  extends IMushopProductSpecification,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
