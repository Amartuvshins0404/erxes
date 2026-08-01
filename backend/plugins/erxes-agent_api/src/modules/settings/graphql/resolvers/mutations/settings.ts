import { IContext } from '~/connectionResolvers';
import { IMastraSettings } from '@/settings/@types/settings';
import { resetObservabilityHosts } from '~/mastra/scoring/observability';
import { resetLangfuseClients } from '~/mastra/scoring/langfuseClient';

/** Mutations for the plugin-wide Mastra settings document. */
export const settingsMutations = {
  mastraSettingsSave: async (
    _parent: undefined,
    { doc }: { doc: IMastraSettings },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('settingsManage');
    await models.MastraSettings.saveSettings(doc);
    resetObservabilityHosts();
    resetLangfuseClients();

    // Re-read through the cache-aware model so the write-only DSN can become a
    // boolean response without ever returning the secret itself.
    const persisted = await models.MastraSettings.getSettings();
    const obj: IMastraSettings = persisted.toObject
      ? persisted.toObject()
      : persisted;
    const { evaluationDsn, ...safeSettings } = obj;
    return {
      ...safeSettings,
      evaluationDsnConfigured: Boolean(evaluationDsn?.trim()),
    };
  },
};
