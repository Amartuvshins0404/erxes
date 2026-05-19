import { IContractPaymentDocument } from '@/contract/@types/payment';
import { IContext } from '~/connectionResolvers';

const loadContract = async (
  payment: IContractPaymentDocument,
  models: IContext['models'],
) => {
  if (!payment.contractId) return null;
  return models.Contract.findOne({ _id: payment.contractId });
};

export default {
  contractNumber: async (
    payment: IContractPaymentDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (payment.contractNumber) return payment.contractNumber;
    const contract = await loadContract(payment, models);
    return contract?.number || null;
  },

  partyId: async (
    payment: IContractPaymentDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (payment.partyId) return payment.partyId;
    const contract = await loadContract(payment, models);
    return contract?.party?.id || null;
  },

  partyType: async (
    payment: IContractPaymentDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (payment.partyType) return payment.partyType;
    const contract = await loadContract(payment, models);
    return contract?.party?.type || null;
  },

  unit: async (
    payment: IContractPaymentDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (payment.unit) return payment.unit;
    const contract = await loadContract(payment, models);
    return contract?.unit || null;
  },
};
