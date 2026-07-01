import { Model } from 'mongoose';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { providerSchema } from '@/provider/db/definitions/provider';
import {
  IMastraProvider,
  IMastraProviderDocument,
} from '@/provider/@types/provider';

export interface IMastraProviderModel extends Model<IMastraProviderDocument> {
  getProvider(_id: string): Promise<IMastraProviderDocument>;
  getProviders(): Promise<IMastraProviderDocument[]>;
  saveProvider(doc: IMastraProvider): Promise<IMastraProviderDocument>;
  removeProvider(_id: string): Promise<{ ok: number }>;
}

// Build the persisted update from an incoming save doc. Both `apiKey` and the
// custom `headers` (whose values can carry auth secrets) are WRITE-ONLY: a
// blank/empty value is dropped so the existing stored secret is kept (the masked
// UI submits an empty key/header map when the admin doesn't re-type them). A
// non-empty value sets/replaces it. Mirrors the voice BYOK blank-token handling.
export const buildProviderUpdate = (doc: IMastraProvider): IMastraProvider => {
  const { apiKey, headers, ...rest } = doc;
  const update: IMastraProvider = { ...rest };
  if (typeof apiKey === 'string' && apiKey.trim()) {
    update.apiKey = apiKey.trim();
  }
  if (headers && typeof headers === 'object' && Object.keys(headers).length) {
    update.headers = headers;
  }
  return update;
};

export const loadProviderClass = (_models: IModels) => {
  class MastraProvider {
    public static async getProvider(_id: string) {
      const p = await _models.MastraProvider.findOne({ _id });
      if (!p) throw new ExpectedError('Provider not found');
      return p;
    }

    public static async getProviders() {
      return _models.MastraProvider.find().sort({ provider: 1 });
    }

    public static async saveProvider(doc: IMastraProvider) {
      // If setting as default, clear other defaults first
      if (doc.isDefault) {
        await _models.MastraProvider.updateMany(
          {},
          { $set: { isDefault: false } },
        );
      }

      const update = buildProviderUpdate(doc);

      const existing = await _models.MastraProvider.findOne({
        provider: doc.provider,
      });
      if (existing) {
        return _models.MastraProvider.findOneAndUpdate(
          { provider: doc.provider },
          { $set: update },
          { new: true },
        );
      }
      return _models.MastraProvider.create(update);
    }

    public static async removeProvider(_id: string) {
      return _models.MastraProvider.deleteOne({ _id });
    }
  }

  providerSchema.loadClass(MastraProvider);
  return providerSchema;
};
