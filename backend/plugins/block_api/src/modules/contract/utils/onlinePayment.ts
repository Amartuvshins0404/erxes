import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContractPaymentInvoice } from '@/contract/@types/paymentSettings';
import { CONTRACT_PAYMENT_CONTENT_TYPE } from '@/contract/constants';
import { IModels } from '~/connectionResolvers';

interface ICreateInvoiceArgs {
  models: IModels;
  subdomain: string;
  paymentId: string;
  amount?: number;
  cpUserId?: string;
  email?: string;
  phone?: string;
  redirectUri?: string;
}

// Amounts travel through QPay in tugriks with two decimals; rounding here keeps
// "pay the remainder" from leaving a fraction behind that never settles.
const round = (value: number) => Math.round(value * 100) / 100;

const resolveCustomerContact = async (
  subdomain: string,
  customerId?: string,
) => {
  if (!customerId) {
    return { email: '', phone: '' };
  }

  const customer = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'customers',
    action: 'findOne',
    input: { _id: customerId },
    defaultValue: null,
  });

  return {
    email: customer?.primaryEmail || '',
    phone: customer?.primaryPhone || '',
  };
};

export const createContractPaymentInvoice = async ({
  models,
  subdomain,
  paymentId,
  amount,
  cpUserId,
  email,
  phone,
  redirectUri,
}: ICreateInvoiceArgs): Promise<IContractPaymentInvoice> => {
  const payment = await models.ContractPayment.findOne({ _id: paymentId });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status === 'paid') {
    throw new Error('This payment is already settled');
  }

  if (payment.status === 'cancelled') {
    throw new Error('This payment is cancelled');
  }

  const remaining = round((payment.amount || 0) - (payment.paidAmount || 0));

  if (remaining <= 0) {
    throw new Error('This payment has nothing left to pay');
  }

  const settings = await models.ContractPaymentSettings.getSettings(
    payment.projectId,
  );
  const paymentIds = settings?.paymentIds || [];

  if (!paymentIds.length) {
    throw new Error(
      'Online payment is not configured: no payment method is selected in contract payment settings',
    );
  }

  let invoiceAmount = remaining;

  if (amount !== undefined && amount !== null) {
    const requested = round(amount);

    if (requested <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (requested > remaining) {
      throw new Error('Amount cannot exceed the remaining amount');
    }

    if (!settings?.allowPartial && requested !== remaining) {
      throw new Error('Partial payment is not allowed for this org');
    }

    invoiceAmount = requested;
  }

  const contact = await resolveCustomerContact(subdomain, payment.customerId);
  const currency = payment.currency || 'MNT';

  const invoice = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'mutation',
    module: 'payment',
    action: 'getOrCreateInvoiceUrl',
    input: {
      amount: invoiceAmount,
      currency,
      email: email || contact.email,
      phone: phone || contact.phone,
      description: [payment.contractNumber, payment.label]
        .filter(Boolean)
        .join(' — '),
      customerId: payment.customerId,
      customerType: 'customer',
      contentType: CONTRACT_PAYMENT_CONTENT_TYPE,
      contentTypeId: payment._id.toString(),
      paymentIds,
      redirectUri,
      data: {
        contractId: payment.contractId.toString(),
        contractNumber: payment.contractNumber,
        paymentIndex: payment.index,
        cpUserId,
      },
    },
    defaultValue: null,
  });

  if (!invoice?.invoiceId || !invoice?.url) {
    throw new Error(
      'Failed to create payment invoice: payment plugin is unavailable',
    );
  }

  return {
    invoiceId: invoice.invoiceId,
    url: invoice.url,
    amount: invoiceAmount,
    currency,
  };
};

interface IInvoiceTransaction {
  status?: string;
  paymentKind?: string;
  payment?: { kind?: string };
}

interface IPaymentInvoice {
  _id: string;
  amount?: number;
  status?: string;
  contentType?: string;
  contentTypeId?: string;
  transactions?: IInvoiceTransaction[];
}

const fetchInvoice = (
  subdomain: string,
  invoiceId: string,
): Promise<IPaymentInvoice | null> =>
  sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    module: 'payment',
    action: 'getInvoiceWithTransactions',
    input: { _id: invoiceId },
    defaultValue: null,
  });

// The paid-invoice callback carries the invoice, not the method that settled
// it, so the actual kind (`qpay`, …) is read off the invoice's transactions:
// `paymentKind` is stamped on the transaction itself and survives a deleted
// payment method, with the joined method as a fallback and a neutral label
// when payment_api cannot answer at all.
export const pickInvoicePaymentKind = (
  invoice: IPaymentInvoice | null,
): string => {
  const transactions = invoice?.transactions || [];
  const transaction =
    transactions.find((item) => item.status === 'paid') || transactions[0];

  return transaction?.paymentKind || transaction?.payment?.kind || 'online';
};

export const resolveInvoicePaymentKind = async (
  subdomain: string,
  invoiceId: string,
): Promise<string> => pickInvoicePaymentKind(await fetchInvoice(subdomain, invoiceId));

interface ICheckInvoiceArgs {
  models: IModels;
  subdomain: string;
  contractId: string;
  invoiceId: string;
  customerId: string;
}

export interface IContractPaymentInvoiceCheck {
  status: string;
  paymentStatus: string;
  paidAmount: number;
  amount: number;
}

// Re-asks the payment provider about an invoice the customer says they paid,
// for when QPay's callback to payment_api never arrived. payment_api's own
// tRPC `checkInvoice` only reports the status — unlike its GraphQL
// `invoicesCheck` it does not re-fire the plugin callback — so a paid result
// has to be credited here, through the same idempotent path the callback uses.
export const checkContractPaymentInvoice = async ({
  models,
  subdomain,
  contractId,
  invoiceId,
  customerId,
}: ICheckInvoiceArgs): Promise<IContractPaymentInvoiceCheck> => {
  const invoice = await fetchInvoice(subdomain, invoiceId);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.contentType !== CONTRACT_PAYMENT_CONTENT_TYPE) {
    throw new Error('Invoice does not belong to a contract payment');
  }

  const payment = await models.ContractPayment.findOne({
    _id: invoice.contentTypeId,
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // The caller is trusted to have authenticated the customer, but not to have
  // picked the right payment: the invoice must belong to the contract and the
  // customer the caller actually verified.
  if (
    payment.contractId.toString() !== contractId ||
    payment.customerId !== customerId
  ) {
    throw new Error('Payment not found');
  }

  const status = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'mutation',
    module: 'payment',
    action: 'checkInvoice',
    input: { _id: invoiceId },
    defaultValue: null,
  });

  if (status === 'paid' && invoice.amount) {
    await models.ContractPayment.recordOnlinePayment({
      paymentId: payment._id.toString(),
      invoiceId,
      amount: invoice.amount,
      paymentMethod: pickInvoicePaymentKind(invoice),
    });
  }

  const current = await models.ContractPayment.findOne({ _id: payment._id });

  return {
    status: status || invoice.status || 'pending',
    paymentStatus: current?.status || payment.status,
    paidAmount: current?.paidAmount || 0,
    amount: current?.amount || payment.amount,
  };
};
