import { IContext } from '~/connectionResolvers';

export const contractPaymentMutations = {
  blockAddPaymentTransaction: async (
    _parent: undefined,
    {
      paymentId,
      amount,
      date,
      note,
      paymentMethod,
    }: {
      paymentId: string;
      amount: number;
      date?: Date;
      note?: string;
      paymentMethod?: string;
    },
    { models, user }: IContext,
  ) => {
    return models.ContractPayment.addTransaction(paymentId, {
      amount,
      date,
      note,
      paymentMethod,
      createdBy: user?._id,
    });
  },

  blockUpdatePaymentTransaction: async (
    _parent: undefined,
    {
      _id,
      amount,
      date,
      note,
      paymentMethod,
    }: { _id: string; amount?: number; date?: Date; note?: string; paymentMethod?: string },
    { models }: IContext,
  ) => {
    return models.ContractPayment.updateTransaction(_id, {
      amount,
      date,
      note,
      paymentMethod,
    });
  },

  blockRemovePaymentTransaction: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.ContractPayment.removeTransaction(_id);
  },
};
