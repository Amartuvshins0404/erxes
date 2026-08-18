import { CurrencyCode } from 'erxes-ui';

export interface IOfferInput {
  paymentPlanId: string;
  amount: number;
  amountType: string;
  status: string;
  endDate: string;
  partyType: string;
  partyId: string;
  user: string;
  currency: CurrencyCode;
}

export interface IOffer extends IOfferInput {
  _id: string;
  number: string;
  party: {
    type: string;
    id: string;
  };
}
