import { Document } from 'mongoose';

export interface IReserveRemsAddParams {
  placeEntityIds?: string[];
  productCategoryId: string;
  productId: string;
  remainder: number;
}

export interface IReserveRem {
  placeEntityId: string;
  productId: string;
  uom: string;
  remainder: number;
}

export interface IReserveRemDocument extends IReserveRem, Document {
  _id: string;
  createdAt?: Date;
  createdBy?: string;
  modifiedAt?: Date;
  modifiedBy?: string;
  confirmedData?: any;
}
