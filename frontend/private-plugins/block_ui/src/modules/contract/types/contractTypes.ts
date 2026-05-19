import { CurrencyCode } from 'erxes-ui';

export enum ContractPartyType {
  CUSTOMER = 'customer',
  COMPANY = 'company',
}

export enum ContractAmountType {
  PER_SIZE = 'perSize',
  PER_UNIT = 'perUnit',
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
  advancePaymentPercentage?: number;
  discountPercentage?: number;
  description?: string;
  installment?: number;
  frequency?: string;
  penaltyPercentage?: number;
  vatIncluded?: boolean;
  paymentDates?: number[];
}

export interface IContractInput {
  unit: string;
  number?: string;
  currency?: CurrencyCode;
  date?: string;
  amount?: number;
  amountType?: ContractAmountType;
  status?: string;
  startDate?: string;
  endDate?: string;
  isLifeTime?: boolean;
  party?: IContractParty;
  paymentPlan?: IContractPaymentPlan;
  user?: string;
}

export interface IContract extends IContractInput {
  _id: string;
  party: IContractParty;
  paymentPlan?: IContractPaymentPlan;
}
