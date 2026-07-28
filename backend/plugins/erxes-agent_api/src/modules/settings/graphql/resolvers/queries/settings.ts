import { IContext } from '~/connectionResolvers';
import { isAdvancedMemoryEnabled } from '~/mastra/memory/config';
import { getStorageStatus } from '~/mastra/files/storage';
import { resolveVoiceStatusForTenant } from '~/mastra/voice/resolveConfig';
import { IModels } from '~/connectionResolvers';
import { toPublicSettings } from '@/settings/utils/publicSettings';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

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

/** Queries for plugin settings plus their derived feature-status blocks. */
export const settingsQueries = {
  mastraUserAgentQuota: async (
    _parent: undefined,
    { userId }: { userId: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.quotasManage);
    return models.MastraUserSettings.getUserSettings(userId);
  },
  // Lightweight status for the chat UI: decides whether the attach button shows.
  mastraAttachmentStorageStatus: async (
    _parent: undefined,
    _args: undefined,
    { models, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.statusRead);
    return attachmentStorageStatus(models, subdomain);
  },

  // Lightweight status for the chat UI: decides whether the voice mode entry
  // point shows. Per-tenant (the tenant's stored Chimege tokens win over env),
  // no secrets exposed — just the round-trip `enabled` boolean.
  mastraVoiceStatus: async (
    _parent: undefined,
    _args: undefined,
    { subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.statusRead);
    return resolveVoiceStatusForTenant(subdomain);
  },

  mastraSettings: async (
    _parent: undefined,
    _args: undefined,
    { models, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.manage);
    const doc = await models.MastraSettings.getSettings();

    return {
      ...toPublicSettings(doc),
      attachmentStorage: await attachmentStorageStatus(models, subdomain),
      // Read-only, env-derived flag surfaced for display only.
      advancedMemory: isAdvancedMemoryEnabled(),
    };
  },
};
