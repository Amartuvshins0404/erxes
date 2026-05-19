import { Document } from 'mongoose';

export interface IContractPayment {
  contractId: string;
  contractNumber?: string;
  partyId?: string;
  partyType?: string;
  projectId?: string;
  unit?: string;
  index: number;
  label?: string;
  dueDate: Date;
  amount: number;
  currency?: string;
  paid: boolean;
  paidAmount?: number;
  paidDate?: Date;
  note?: string;
}

export interface IContractPaymentDocument
  extends IContractPayment,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
