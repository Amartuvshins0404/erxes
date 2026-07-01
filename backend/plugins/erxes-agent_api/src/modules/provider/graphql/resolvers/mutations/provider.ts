import { IContext } from '~/connectionResolvers';
import { IMastraProvider } from '@/provider/@types/provider';
import { toPublicProvider } from '@/provider/utils/mask';

/** Mutations for stored LLM provider credentials/configs. */
export const providerMutations = {
  mastraProviderSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraProvider },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('providersManage');
    // Echo back the secret-free view so the key never returns to the browser.
    return toPublicProvider(await models.MastraProvider.saveProvider(doc));
  },

  mastraProviderRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('providersRemove');
    return models.MastraProvider.removeProvider(_id);
  },
};
