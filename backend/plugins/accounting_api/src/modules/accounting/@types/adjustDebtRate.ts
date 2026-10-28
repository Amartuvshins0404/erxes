import { Document } from 'mongoose';

export interface IAdjustDebtRateDetail {
  _id?: string;

  accountId: string;
  customerType?: string;
  customerId?: string;
  placeEntityId?: string;
  responsibleEntityId?: string;
  mainBalance: number;
  currencyBalance: number;

  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IAdjustDebtRate {
  _id?: string;

  date: Date;
  mainCurrency: string;
  currency: string;

  customerType?: string;
  customerId?: string;

  description?: string;

  spotRate: number;

  gainAccountId: string;
  lossAccountId: string;
  transactionId?: string;
  status?: 'draft' | 'process' | 'complete';
  beginDate?: Date;
  successDate?: Date;
  checkedAt?: Date;
  error?: string;
  warning?: string;

  details?: IAdjustDebtRateDetail[];

  placeEntityId?: string;
  responsibleEntityId?: string;

  createdBy: string;
  modifiedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdjustDebtRateDocument extends IAdjustDebtRate, Document {
  _id: string;
}
