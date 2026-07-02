import { CurrencyCode } from 'erxes-ui';

export enum ContractPartyType {
  CUSTOMER = 'customer',
  COMPANY = 'company',
}

export enum ContractAmountType {
  PER_SIZE = 'perSize',
  PER_UNIT = 'perUnit',
}

export enum ContractStatus {
  DRAFT = 'draft',
  SIGNED = 'signed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ContractPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VIP = 'vip',
}

export enum ContractInterestType {
  SIMPLE = 'SIMPLE',
  FLAT = 'FLAT',
  REDUCING = 'REDUCING',
}

export interface IContractParty {
  type: ContractPartyType;
  id: string;
}

export interface IContractPaymentPlan {
  type: string;
  downPaymentPercentage?: number;
  interestPercentage?: number;
  interestType?: ContractInterestType;
  completionPaymentPercentage?: number;
  discountPercentage?: number;
  description?: string;
  installment?: number;
  frequency?: string;
  penaltyPercentage?: number;
  vatIncluded?: boolean;
  paymentDates?: number[];
}

export interface IContractMarket {
  name: string;
  amount: number;
  percentage: number;
}

export interface IContractInput {
  unit: string;
  number?: string;
  currency?: CurrencyCode;
  date?: string;
  amount?: number;
  amountType?: ContractAmountType;
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  isLifeTime?: boolean;
  party?: IContractParty;
  paymentPlan?: IContractPaymentPlan;
  user?: string;
  priority?: ContractPriority | ContractPriority[];
  customerName?: string;
  customerId?: string;
  reinsurance?: string;
  main?: string;
  category?: string;
  insuranceType?: string;
  placingBroker?: string;
  producingBroker?: string;
  createdAt?: string;
  updatedAt?: string;
  inceptionDate?: string;
  expiryDate?: string;
  markets?: IContractMarket[];
}

export interface IContract extends IContractInput {
  _id: string;
  party: IContractParty;
  paymentPlan?: IContractPaymentPlan;
}
