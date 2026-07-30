import { IContext } from '~/connectionResolvers';

export const cpPoscProduct = {
  supplier: async (
    _product: { _id: string },
    _args: undefined,
    { models }: IContext,
  ) => {
    return models.Supplier.findOne().lean();
  },
};
