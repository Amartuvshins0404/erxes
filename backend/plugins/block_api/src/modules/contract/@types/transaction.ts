import { Document } from 'mongoose';

export interface IContractPaymentTransaction {
  paymentId: string;
  contractId: string;
  amount: number;
  date: Date;
  note?: string;
  createdBy?: string;
  paymentMethod?: string;
}

export interface IContractPaymentTransactionDocument
  extends IContractPaymentTransaction,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
