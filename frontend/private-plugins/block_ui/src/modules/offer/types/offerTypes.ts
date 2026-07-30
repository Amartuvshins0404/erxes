import { CurrencyCode } from 'erxes-ui';

export interface IOfferPaymentPlan {
  downPaymentPercentage?: number;
  downPaymentAmount?: number;
  barterPercentage?: number;
  barterAmount?: number;
  interestPercentage?: number;
  interestType?: string;
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

export interface IOffer {
  _id: string;
  number: string;
  unit: string;
  project?: string;
  amount: number;
  status: 'draft' | 'sent';
  currency: CurrencyCode;
  date: string;
  endDate: string;
  party: {
    type: string;
    id: string;
  };
  paymentPlan?: IOfferPaymentPlan;
  user: string;
}

export interface IOfferInput {
  unit: string;
  amount: number;
  currency: CurrencyCode;
  date?: Date;
  endDate?: Date;
  party?: { type: string; id: string };
  paymentPlan?: IOfferPaymentPlan;
  user?: string;
  status?: 'draft' | 'sent';
}
