import { IContractPaymentDocument } from '@/contract/@types/payment';
import { sendMessage } from '@/admin/utils';

const toSyncRow = (payment: IContractPaymentDocument) => ({
  _id: payment._id,
  contractNumber: payment.contractNumber,
  customerId: payment.customerId,
  index: payment.index,
  label: payment.label,
  dueDate: payment.dueDate,
  amount: payment.amount,
  currency: payment.currency,
  status: payment.status,
  paidAmount: payment.paidAmount,
  paidDate: payment.paidDate,
  note: payment.note,
});

// Mirrors block_api's regenerate-on-signed semantics: block-admin replaces
// its whole schedule for this contract with exactly what's passed here.
export const syncContractPayments = (
  contractId: string,
  payments: IContractPaymentDocument[],
  subdomain: string,
) => {
  sendMessage({
    subdomain,
    path: 'blockSyncContractPayments',
    payload: {
      entityId: contractId,
      data: {
        payments: payments.map(toSyncRow),
      },
    },
  });
};
