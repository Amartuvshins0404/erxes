import { IContext } from '~/connectionResolvers';
import { IMastraSettings } from '@/settings/@types/settings';
import { toPublicSettings } from '@/settings/utils/publicSettings';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

/** Mutations for the plugin-wide Mastra settings document. */
export const settingsMutations = {
  mastraSettingsSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraSettings },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.manage);
    if (doc.defaultAgentQuota !== undefined) {
      await checkPermission(ERXES_AGENT_ACTIONS.settings.quotasManage);
    }
    return toPublicSettings(await models.MastraSettings.saveSettings(doc));
  },

  mastraUserAgentQuotaSet: async (
    _parent: undefined,
    { userId, quota }: { userId: string; quota?: number | null },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.quotasManage);
    // null or undefined clears the per-user override (falls back to default)
    return models.MastraUserSettings.setUserQuota(userId, quota ?? null);
  },
};
