import { CurrencyCode } from 'erxes-ui';

export enum ContractPartyType {
  CUSTOMER = 'customer',
  COMPANY = 'company',
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
  downPaymentPercentage?: number;
  downPaymentAmount?: number;
  barterPercentage?: number;
  barterAmount?: number;
  interestPercentage?: number;
  interestType?: ContractInterestType;
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
  paymentDueDates?: string[];
  firstPaymentDate?: string;
  downPaymentDate?: string;
  completionPaymentDate?: string;
  completionPaymentDateLabel?: string;
}

export interface IContractInput {
  unit: string;
  number?: string;
  currency?: CurrencyCode;
  date?: string;
  amount?: number;
  status?: string;
  party?: IContractParty;
  paymentPlan?: IContractPaymentPlan;
  user?: string;
}

export interface IContract extends IContractInput {
  _id: string;
  party: IContractParty;
  paymentPlan?: IContractPaymentPlan;
}
