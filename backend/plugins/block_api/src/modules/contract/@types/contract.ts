import {
  BlockProjectPaymentPlanInterestType,
  BlockProjectPaymentPlanType,
} from '@/project/@types/payment';

export enum ContractPartyType {
  CUSTOMER = 'customer',
  COMPANY = 'company',
}

export enum ContractAmountType {
  PER_SIZE = 'perSize',
  PER_UNIT = 'perUnit',
}

export interface IContractParty {
  type: ContractPartyType;
  id: string;
}

// Status is now an ObjectId reference to a ContractStatus document.
// Stage semantics (reserved/draft/signed/cancelled/lost) live on ContractStatus.type.

export interface IContractPaymentPlan {
  type: BlockProjectPaymentPlanType;
  downPaymentPercentage: number;
  interestPercentage: number;
  advancePaymentPercentage: number;
  discountPercentage: number;
  description: string;
  installment: number;
  frequency: string;
  penaltyPercentage: number;
  vatIncluded: boolean;
  paymentDates: number[];
  interestType: BlockProjectPaymentPlanInterestType;
}

export interface IContract {
  _id: string;
  number: string;
  unit: string;
  date: Date;
  amount: number;
  amountType: ContractAmountType;
  currency: string;
  status: string;
  startDate: Date;
  endDate: Date;
  isLifeTime: boolean;
  party: IContractParty;
  paymentPlan: IContractPaymentPlan;
  user: string;
  description: string;
}

export interface IContractDocument extends IContract, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
