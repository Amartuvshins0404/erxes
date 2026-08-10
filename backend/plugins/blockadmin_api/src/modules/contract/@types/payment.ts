import { Document } from 'mongoose';
import { IBlock } from '~/types';

export type ContractPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface IContractPayment extends IBlock {
  contractId: string;
  contractNumber?: string;
  customerId?: string;
  index: number;
  label?: string;
  dueDate?: Date;
  amount: number;
  currency?: string;
  status: ContractPaymentStatus;
  paidAmount: number;
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

// A row as sent by block_api's webhook payload — _id there is that org's
// own payment id, which becomes this row's entityId once mirrored.
export interface IContractPaymentSyncRow {
  _id: string;
  contractNumber?: string;
  customerId?: string;
  index: number;
  label?: string;
  dueDate?: Date;
  amount: number;
  currency?: string;
  status: ContractPaymentStatus;
  paidAmount: number;
  paidDate?: Date;
  note?: string;
}
