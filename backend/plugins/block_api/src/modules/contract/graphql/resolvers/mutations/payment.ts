import { IContext } from '~/connectionResolvers';

export const contractPaymentMutations = {
  blockMarkContractPaymentPaid: async (
    _parent: undefined,
    {
      _id,
      paidAmount,
      paidDate,
      note,
    }: { _id: string; paidAmount?: number; paidDate?: Date; note?: string },
    { models }: IContext,
  ) => {
    return models.ContractPayment.markPaid(_id, { paidAmount, paidDate, note });
  },

  blockMarkContractPaymentUnpaid: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.ContractPayment.markUnpaid(_id);
  },
};
