import { BlockProjectPaymentPlanInterestType } from '@/project/@types/payment';
import { Document } from 'mongoose';
import { IBlock } from '~/types';

export enum ContractAmountType {
  PER_SIZE = 'perSize',
  PER_UNIT = 'perUnit',
}

export enum ContractStatus {
  RESERVED = 'reserved',
  DRAFT = 'draft',
  SIGNED = 'signed',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

export interface IContractPaymentPlan {
  downPaymentPercentage?: number;
  downPaymentAmount?: number;
  barterPercentage?: number;
  barterAmount?: number;
  interestPercentage?: number;
  interestType?: BlockProjectPaymentPlanInterestType;
  completionPaymentPercentage?: number;
  completionPaymentAmount?: number;
  discountPercentage?: number;
  description?: string;
  installment?: number;
  frequency?: string;
  penaltyPercentage?: number;
  vatIncluded?: boolean;
  roundedInstallmentAmount?: number;
  installmentAmounts?: number[];
  paymentDates?: number[];
  paymentDueDates?: Date[];
  firstPaymentDate?: Date;
  downPaymentDate?: Date;
  completionPaymentDate?: Date;
  completionPaymentDateLabel?: string;
}

export interface IContract extends IBlock {
  _id: string;
  number: string;
  unit: string;
  date: Date;
  amount: number;
  amountType: ContractAmountType;
  currency: string;
  status: ContractStatus;
  isLifeTime: boolean;
  paymentPlan: IContractPaymentPlan;
  user: string;
  description: string;
  customerId?: string;
  signedAt?: Date;
}

export interface IContractDocument extends IContract, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
