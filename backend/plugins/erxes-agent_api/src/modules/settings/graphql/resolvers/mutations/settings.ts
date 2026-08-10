import { IContext } from '~/connectionResolvers';
import { IMastraSettings } from '@/settings/@types/settings';
import { toPublicSettings } from '@/settings/publicSettings';

/** Mutations for the plugin-wide Mastra settings document. */
export const settingsMutations = {
  mastraSettingsSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraSettings },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('settingsManage');
    const persisted = await models.MastraSettings.saveSettings(doc);
    return toPublicSettings(persisted);
  },
};
