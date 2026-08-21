import { IContractPaymentDocument } from '@/contract/@types/payment';
import { IModels } from '~/connectionResolvers';
import { notifyBlockCustomer } from '~/utils/cpNotify';

export const paymentLabel = (payment: IContractPaymentDocument) =>
  payment.label ||
  (payment.contractNumber
    ? `${payment.contractNumber} #${payment.index + 1}`
    : `#${payment.index + 1}`);

export const notifyPayment = async (
  models: IModels,
  payment: IContractPaymentDocument,
  data: {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error';
  },
) => {
  if (!payment.customerId) {
    return;
  }

  await notifyBlockCustomer(models, payment.subdomain, payment.customerId, {
    ...data,
    contentType: 'blockadmin:contractPayment',
    contentTypeId: payment._id,
  });
};
