import { IContext, IModels } from '~/connectionResolvers';
import { getStorageStatus } from '~/mastra/files/storage';
import { IMastraSettings } from '@/settings/@types/settings';

// configured (core storage) AND the plugin toggle → attachments usable in chat.
export async function attachmentStorageStatus(
  models: IModels,
  subdomain: string,
) {
  const [settings, storage] = await Promise.all([
    models.MastraSettings.getSettings(),
    getStorageStatus(subdomain),
  ]);
  return {
    configured: storage.configured,
    serviceType: storage.serviceType,
    enabled: storage.configured && settings?.attachmentsEnabled !== false,
  };
}

/** Settings queries and the attachment feature-status block. */
export const settingsQueries = {
  // Lightweight status for the chat UI: decides whether the attach button shows.
  mastraAttachmentStorageStatus: (
    _parent: undefined,
    _args: undefined,
    { models, subdomain }: IContext,
  ) => {
    return attachmentStorageStatus(models, subdomain);
  },

  mastraSettings: async (
    _parent: undefined,
    _args: undefined,
    { models, subdomain, checkPermission }: IContext,
  ) => {
    // The lightweight attachment status stays open for the chat composer;
    // editing and reading persisted settings remains permission-gated.
    await checkPermission('settingsView');
    const doc = await models.MastraSettings.getSettings();
    const obj: IMastraSettings = doc?.toObject ? doc.toObject() : doc;
    const { evaluationDsn, ...safeSettings } = obj;

    return {
      ...safeSettings,
      evaluationDsnConfigured: Boolean(evaluationDsn?.trim()),
      attachmentStorage: await attachmentStorageStatus(models, subdomain),
    };
  },
};
