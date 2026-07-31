import { IContext } from '~/connectionResolvers';
import { IMastraProvider } from '@/provider/@types/provider';
import { toPublicProvider } from '@/provider/utils/mask';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

/** Mutations for stored LLM provider credentials/configs. */
export const providerMutations = {
  mastraProviderSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraProvider },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.manage);
    // Echo back the secret-free view so the key never returns to the browser.
    return toPublicProvider(await models.MastraProvider.saveProvider(doc));
  },

  mastraProviderRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.remove);
    return models.MastraProvider.removeProvider(_id);
  },
};
