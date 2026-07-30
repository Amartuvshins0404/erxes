import { IContext } from '~/connectionResolvers';
import { IMastraSettings } from '@/settings/@types/settings';

/** Mutations for the plugin-wide Mastra settings document. */
export const settingsMutations = {
  mastraSettingsSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraSettings },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('settingsManage');
    return models.MastraSettings.saveSettings(doc);
  },
};
