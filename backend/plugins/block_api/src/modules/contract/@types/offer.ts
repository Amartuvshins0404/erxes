import {
  BlockProjectPaymentPlanInterestType,
} from '@/project/@types/payment';

export enum OfferPartyType {
  CUSTOMER = 'customer',
  COMPANY = 'company',
}

export interface IOfferParty {
  type: OfferPartyType;
  id: string;
}

export interface IOfferPaymentPlan {
  downPaymentPercentage: number;
  downPaymentAmount?: number;
  barterPercentage?: number;
  barterAmount?: number;
  interestPercentage: number;
  interestType: BlockProjectPaymentPlanInterestType;
  completionPaymentPercentage: number;
  completionPaymentAmount?: number;
  discountPercentage: number;
  description: string;
  installment: number;
  frequency: string;
  penaltyPercentage: number;
  vatIncluded: boolean;
  roundedInstallmentAmount?: number;
  installmentAmounts?: number[];
  paymentDates: number[];
  paymentDueDates?: Date[];
  firstPaymentDate: Date;
  downPaymentDate?: Date;
  completionPaymentDate: Date;
  completionPaymentDateLabel?: string;
}

export enum OfferStatus {
  DRAFT = 'draft',
  SENT = 'sent',
}

export interface IOffer {
  number: string;
  unit: string;
  project?: string;
  date: Date;
  amount: number;
  currency: string;
  status: OfferStatus;
  endDate: Date;
  party: IOfferParty;
  paymentPlan: IOfferPaymentPlan;
  user: string;
  description: string;
}

export interface IOfferInvoice {
  _id: string;
  amount: number;
  date: Date;
  customDate?: string;
  description: string;
  status: string;
  number: number;
  paidDate?: Date;
}

export interface IOfferInput extends IOffer {
  invoices: IOfferInvoice[];
}

export interface IOfferDocument extends IOffer, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
