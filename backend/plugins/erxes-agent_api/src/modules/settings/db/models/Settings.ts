import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { settingsSchema } from '@/settings/db/definitions/settings';
import {
  IKnowledgeSyncStatus,
  IMastraSettings,
  IMastraSettingsDocument,
} from '@/settings/@types/settings';

export interface IMastraSettingsModel extends Model<IMastraSettingsDocument> {
  getSettings(): Promise<IMastraSettingsDocument>;
  saveSettings(doc: IMastraSettings): Promise<IMastraSettingsDocument>;
  saveKnowledgeSyncStatus(status: IKnowledgeSyncStatus): Promise<void>;
}

// 30-second in-process cache — eliminates a DB round-trip on every turn.
// Busted immediately when saveSettings() is called so UI edits take effect.
//
// Keyed by tenant: the model class is loaded once per tenant connection but this
// module is process-global, so a single shared entry would let tenant B read
// tenant A's MastraSettings within the TTL. We key by the mongoose connection's
// database name — in SaaS every org has its own db (see generate-models useDb),
// and in OS every subdomain shares the one connection (one dataset, one key),
// so the db name is exactly the right isolation boundary here.
interface SettingsCacheEntry {
  doc: IMastraSettingsDocument;
  expiresAt: number;
}
const _settingsCacheByTenant = new Map<string, SettingsCacheEntry>();
const SETTINGS_CACHE_TTL = 30_000;

export const loadSettingsClass = (_models: IModels) => {
  // Resolved lazily inside the static methods: the model isn't assigned onto
  // `_models` until after loadSettingsClass returns, but by request time it is.
  const tenantKey = (): string => _models.MastraSettings.db.name;

  class MastraSettings {
    public static async getSettings() {
      const now = Date.now();
      const key = tenantKey();
      const cached = _settingsCacheByTenant.get(key);
      if (cached && cached.expiresAt > now) {
        return cached.doc;
      }

      let doc = await _models.MastraSettings.findOne({});
      if (!doc) {
        doc = await _models.MastraSettings.create({
          erxesApiUrl:
            process.env.ERXES_AGENT_ERXES_API_URL || 'http://localhost:4000',
          erxesApiToken: process.env.ERXES_AGENT_ERXES_API_TOKEN,
          defaultAgentId: process.env.ERXES_AGENT_DEFAULT_AGENT_ID,
        });
      }

      // Env vars override DB values at runtime (DB is not modified)
      if (process.env.ERXES_AGENT_ERXES_API_URL)
        doc.erxesApiUrl = process.env.ERXES_AGENT_ERXES_API_URL;
      if (process.env.ERXES_AGENT_ERXES_API_TOKEN)
        doc.erxesApiToken = process.env.ERXES_AGENT_ERXES_API_TOKEN;
      if (process.env.ERXES_AGENT_DEFAULT_AGENT_ID)
        doc.defaultAgentId = process.env.ERXES_AGENT_DEFAULT_AGENT_ID;

      _settingsCacheByTenant.set(key, { doc, expiresAt: now + SETTINGS_CACHE_TTL });
      return doc;
    }

    public static async saveSettings(doc: IMastraSettings) {
      _settingsCacheByTenant.delete(tenantKey()); // bust this tenant's cache on save so edits take effect immediately
      const existing = await _models.MastraSettings.findOne({});
      if (existing) {
        return _models.MastraSettings.findOneAndUpdate(
          { _id: existing._id },
          { $set: doc },
          { new: true },
        );
      }
      return _models.MastraSettings.create(doc);
    }

    // Sweep status only — kept separate from saveSettings so the background
    // worker can never clobber user-edited settings fields.
    public static async saveKnowledgeSyncStatus(status: IKnowledgeSyncStatus) {
      const existing = await _models.MastraSettings.getSettings();
      await _models.MastraSettings.updateOne(
        { _id: existing._id },
        { $set: { knowledgeSyncStatus: status } },
      );
    }
  }

  settingsSchema.loadClass(MastraSettings);
  return settingsSchema;
};
