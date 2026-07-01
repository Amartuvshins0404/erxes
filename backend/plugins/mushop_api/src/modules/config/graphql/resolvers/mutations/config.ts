import { IContext } from '~/connectionResolvers';

export const configMutations = {
  mushopConfigSave: async (
    _root: undefined,
    { code, value }: { code: string; value?: number },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopConfigSave');
    return models.Config.save(code, value);
  },
};
