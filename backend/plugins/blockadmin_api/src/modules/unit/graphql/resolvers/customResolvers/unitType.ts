import { IContext } from '~/connectionResolvers';

export default {
  __resolveReference: async (
    { _id },
    _args: undefined,
    { models }: IContext,
  ) => {
    return await models.UnitType.findOne({ _id }).lean();
  },
};
