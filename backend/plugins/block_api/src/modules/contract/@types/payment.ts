import { Document } from 'mongoose';

export type ContractPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface IContractPayment {
  contractId: string;
  contractNumber?: string;
  partyId?: string;
  partyType?: string;
  projectId?: string;
  unit?: string;
  index: number;
  label?: string;
  dueDate?: Date;
  amount: number;
  currency?: string;
  status: ContractPaymentStatus;
  paidAmount: number;
  paidDate?: Date;
  note?: string;
  penaltyAmount?: number;
  overdueDays?: number;
}

export interface IContractPaymentDocument
  extends IContractPayment,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
