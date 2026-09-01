import { CONTRACT_PAYMENT_CONTENT_TYPE } from '@/contract/constants';
import { resolveInvoicePaymentKind } from '@/contract/utils/onlinePayment';
import { generateModels } from '~/connectionResolvers';

interface IPaidInvoiceData {
  _id: string;
  contentType?: string;
  contentTypeId?: string;
  status?: string;
  amount?: number;
  resolvedAt?: Date;
}

export const payments = {
  transactionCallback: async () => {
    // no-op: a contract payment is only credited once its whole invoice is
    // paid, which arrives through `callback` below.
  },
  callback: async (
    { subdomain }: { subdomain: string },
    data: IPaidInvoiceData,
  ) => {
    if (data.status !== 'paid') {
      return;
    }

    if (data.contentType !== CONTRACT_PAYMENT_CONTENT_TYPE) {
      return;
    }

    if (!data.contentTypeId || !data.amount) {
      console.error(
        `[block:payments] Invoice ${data._id} is missing a payment id or amount`,
      );

      return;
    }

    try {
      const models = await generateModels(subdomain);

      const paymentMethod = await resolveInvoicePaymentKind(subdomain, data._id);

      // Recording the transaction recomputes the payment's status and pushes
      // the whole schedule back to blockadmin_api, which is what turns the
      // customer's portal row green and fires their notification.
      await models.ContractPayment.recordOnlinePayment({
        paymentId: data.contentTypeId,
        invoiceId: data._id,
        amount: data.amount,
        date: data.resolvedAt ? new Date(data.resolvedAt) : new Date(),
        paymentMethod,
      });
    } catch (e: any) {
      console.error(
        `[block:payments] callback failed for invoice ${data._id}: ${e.message}`,
      );

      throw e;
    }
  },
};
