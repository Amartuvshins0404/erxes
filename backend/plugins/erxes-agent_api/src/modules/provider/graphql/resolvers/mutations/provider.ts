import { IContext } from '~/connectionResolvers';
import { IMastraProvider } from '@/provider/@types/provider';
import {
  resolveProviderOwner,
  requireProviderAccess,
} from '@/provider/authorization';
import { toPublicProvider } from '@/provider/utils/mask';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

/** Mutations for stored LLM provider credentials/configs. */
export const providerMutations = {
  mastraProviderSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraProvider },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.manage);
    const owner = await resolveProviderOwner({
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.provider.manage,
      requestedScope: doc.scope,
    });
    return toPublicProvider(
      await models.MastraProvider.saveProvider(doc, owner),
    );
  },

  mastraProviderRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.remove);
    const provider = await models.MastraProvider.getProvider(_id);
    await requireProviderAccess({
      provider,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.provider.remove,
    });
    return models.MastraProvider.removeProvider(_id);
  },
};
