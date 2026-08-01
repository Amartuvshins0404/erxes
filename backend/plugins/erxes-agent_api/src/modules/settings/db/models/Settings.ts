import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { settingsSchema } from '@/settings/db/definitions/settings';
import {
  IMastraSettings,
  IMastraSettingsDocument,
} from '@/settings/@types/settings';

export interface IMastraSettingsModel extends Model<IMastraSettingsDocument> {
  getSettings(): Promise<IMastraSettingsDocument>;
  saveSettings(doc: IMastraSettings): Promise<IMastraSettingsDocument>;
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

interface PersistedSettings extends IMastraSettings {
  _id: string;
  erxesApiToken?: unknown;
  defaultAgentId?: unknown;
}

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

      const persisted = (await _models.MastraSettings.findOne({})
        .select('+evaluationDsn')
        .lean()) as PersistedSettings | null;
      let doc: IMastraSettingsDocument;
      if (!persisted) {
        doc = await _models.MastraSettings.create({});
      } else if (
        'erxesApiToken' in persisted ||
        'defaultAgentId' in persisted
      ) {
        const cleaned = await _models.MastraSettings.findOneAndUpdate(
          { _id: persisted._id },
          {
            $unset: {
              erxesApiToken: 1,
              defaultAgentId: 1,
            },
          },
          { new: true, strict: false },
        );
        doc = cleaned ?? (await _models.MastraSettings.create({}));
      } else {
        doc = _models.MastraSettings.hydrate(persisted);
      }

      _settingsCacheByTenant.set(key, {
        doc,
        expiresAt: now + SETTINGS_CACHE_TTL,
      });
      return doc;
    }

    public static async saveSettings(doc: IMastraSettings) {
      _settingsCacheByTenant.delete(tenantKey()); // bust this tenant's cache on save so edits take effect immediately
      const existing = await _models.MastraSettings.exists({});
      if (existing) {
        return _models.MastraSettings.findOneAndUpdate(
          { _id: existing._id },
          {
            $set: doc,
            $unset: {
              erxesApiToken: 1,
              defaultAgentId: 1,
            },
          },
          { new: true, strict: false, runValidators: true },
        );
      }
      return _models.MastraSettings.create(doc);
    }
  }

  settingsSchema.loadClass(MastraSettings);
  return settingsSchema;
};
