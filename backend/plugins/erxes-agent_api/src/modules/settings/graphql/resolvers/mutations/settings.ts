import { IContext } from '~/connectionResolvers';
import { IMastraSettings } from '@/settings/@types/settings';
import { resetObservabilityHosts } from '~/mastra/scoring/observability';
import { resetLangfuseClients } from '~/mastra/scoring/langfuseClient';
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
    resetObservabilityHosts();
    resetLangfuseClients();
    return toPublicSettings(persisted);
  },
};
