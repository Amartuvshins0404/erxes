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

  mastraUserAgentQuotaSet: async (
    _parent: undefined,
    { userId, quota }: { userId: string; quota?: number | null },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('settingsManage');
    // null or undefined clears the per-user override (falls back to default)
    return models.MastraUserSettings.setUserQuota(userId, quota ?? null);
  },
};
