import { markResolvers } from 'erxes-api-shared/utils';
import { sendBlockMessage } from '~/modules/block/utils';
import { IContext } from '~/connectionResolvers';

interface IPaymentInvoiceResponse {
  success?: boolean;
  error?: string;
  invoice?: {
    invoiceId: string;
    url: string;
    amount: number;
    currency: string;
  };
}

interface IPaymentCheckResponse {
  success?: boolean;
  error?: string;
  check?: {
    status: string;
    paymentStatus: string;
    paidAmount: number;
    amount: number;
  };
}

export const cpPaymentMutations = {
  // The portal never creates the invoice itself: the money belongs to the org
  // that owns the contract, so the request is forwarded to that org's block_api,
  // which bills through its own payment plugin (QPay) and later records the
  // settled transaction. This row is only a mirror and is rewritten on the next
  // schedule sync, so nothing about the invoice is stored here.
  cpBlockAdminCreatePaymentInvoice: async (
    _parent: undefined,
    { paymentId, amount }: { paymentId: string; amount?: number },
    { models, cpUser }: IContext,
  ) => {
    const payment = await models.ContractPayment.findOne({
      _id: paymentId,
    }).lean();

    if (!payment) {
      throw new Error('Payment not found');
    }

    const blockCustomer = await models.BlockCustomer.findOne({
      customerId: cpUser?.erxesCustomerId,
      subdomain: payment.subdomain,
    }).lean();

    // A customer can only pay their own schedule, and only in the org the
    // payment actually belongs to.
    if (!blockCustomer || blockCustomer.entityId !== payment.customerId) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'paid') {
      throw new Error('This payment is already settled');
    }

    if (payment.status === 'cancelled') {
      throw new Error('This payment is cancelled');
    }

    const response = await sendBlockMessage({
      subdomain: payment.subdomain,
      path: 'createContractPaymentInvoice',
      payload: {
        entityId: payment.entityId,
        data: {
          amount,
          cpUserId: cpUser?._id,
          email: cpUser?.email,
          phone: cpUser?.phone,
        },
      },
    });

    const result = (await response.json()) as IPaymentInvoiceResponse;

    if (!response.ok || !result?.invoice) {
      throw new Error(result?.error || 'Failed to create payment invoice');
    }

    return result.invoice;
  },

  // Reconciliation for a customer who paid but whose row is still unpaid,
  // because QPay's callback to the org's payment_api never arrived. Keyed on
  // the contract (whose mirrored `_id` is stable) plus the invoice id returned
  // when the invoice was created — never on a payment's own `_id`, which is
  // replaced wholesale on every schedule sync.
  cpBlockAdminCheckPaymentInvoice: async (
    _parent: undefined,
    { contractId, invoiceId }: { contractId: string; invoiceId: string },
    { models, cpUser }: IContext,
  ) => {
    const contract = await models.Contract.findOne({ _id: contractId }).lean();

    if (!contract) {
      throw new Error('Contract not found');
    }

    const blockCustomer = await models.BlockCustomer.findOne({
      customerId: cpUser?.erxesCustomerId,
      subdomain: contract.subdomain,
    }).lean();

    // `Contract.customerId` mirrors block_api's org-side customer id, which is
    // `BlockCustomer.entityId` — not the verified core `customerId`.
    if (!blockCustomer || blockCustomer.entityId !== contract.customerId) {
      throw new Error('Contract not found');
    }

    const response = await sendBlockMessage({
      subdomain: contract.subdomain,
      path: 'checkContractPaymentInvoice',
      payload: {
        entityId: contract.entityId,
        data: {
          invoiceId,
          customerId: blockCustomer.entityId,
        },
      },
    });

    const result = (await response.json()) as IPaymentCheckResponse;

    if (!response.ok || !result?.check) {
      throw new Error(result?.error || 'Failed to check payment invoice');
    }

    return result.check;
  },
};

markResolvers(cpPaymentMutations, {
  wrapperConfig: {
    forClientPortal: true,
    cpUserRequired: true,
  },
});
