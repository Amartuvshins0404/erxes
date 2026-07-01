import { IContext } from '~/connectionResolvers';

export const configQueries = {
  mushopConfig: async (
    _root: undefined,
    { code }: { code: string },
    { models }: IContext,
  ) => {
    return models.Config.getByCode(code);
  },

  mushopConfigs: async (
    _root: undefined,
    { codes }: { codes: string[] },
    { models }: IContext,
  ) => {
    return models.Config.getByCodes(codes);
  },
};
