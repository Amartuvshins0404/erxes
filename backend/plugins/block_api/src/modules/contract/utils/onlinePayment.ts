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

  const settings = await models.ContractPaymentSettings.getSettings();
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

// The paid-invoice callback carries the invoice, not the method that settled
// it, so the actual kind (`qpay`, …) is read back from the invoice's paid
// transaction. Falls back to a neutral label when payment_api cannot answer.
export const resolveInvoicePaymentKind = async (
  subdomain: string,
  invoiceId: string,
): Promise<string> => {
  const invoice = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    module: 'payment',
    action: 'getInvoiceWithTransactions',
    input: { _id: invoiceId },
    defaultValue: null,
  });

  const paidTransaction = (invoice?.transactions || []).find(
    (transaction: { status?: string }) => transaction.status === 'paid',
  );

  return paidTransaction?.payment?.kind || 'online';
};
