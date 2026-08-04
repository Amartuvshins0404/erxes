import {
  BlockProjectPaymentPlanInterestType,
  BlockProjectPaymentPlanType,
} from '@/project/@types/payment';
import { Document } from 'mongoose';
import { IBlock } from '~/types';

export enum ContractAmountType {
  PER_SIZE = 'perSize',
  PER_UNIT = 'perUnit',
}

export enum ContractStatus {
  DRAFT = 'draft',
  SIGNED = 'signed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface IContractPaymentPlan {
  type: BlockProjectPaymentPlanType;
  downPaymentPercentage: number;
  interestPercentage: number;
  completionPaymentPercentage: number;
  discountPercentage: number;
  description: string;
  installment: number;
  frequency: string;
  penaltyPercentage: number;
  vatIncluded: boolean;
  paymentDates: number[];
  interestType: BlockProjectPaymentPlanInterestType;
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
