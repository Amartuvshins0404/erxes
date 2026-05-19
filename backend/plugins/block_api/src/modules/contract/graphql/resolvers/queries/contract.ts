import { IContext } from '~/connectionResolvers';

export const contractQueries = {
  blockGetContract: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Contract.getContract(_id);
  },

  blockGetContracts: async (
    _parent: undefined,
    { unit }: { unit?: string },
    { models }: IContext,
  ) => {
    return models.Contract.find(unit ? { unit } : {});
  },
};

