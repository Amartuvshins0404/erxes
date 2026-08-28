import { Document } from 'mongoose';

export interface IContractPaymentSettings {
  // payment_api PaymentMethod ids (QPay and any other method the org offers
  // online). An empty list means online payment is switched off.
  paymentIds: string[];
  // When false a customer can only settle the whole remaining amount of a
  // scheduled payment; when true any amount up to the remainder is accepted.
  allowPartial: boolean;
}

export interface IContractPaymentSettingsDocument
  extends IContractPaymentSettings,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContractPaymentSettingsInput {
  paymentIds?: string[];
  allowPartial?: boolean;
}

export interface IContractPaymentInvoice {
  invoiceId: string;
  url: string;
  amount: number;
  currency: string;
}
