import { Model } from 'mongoose';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { providerSchema } from '@/provider/db/definitions/provider';
import {
  IMastraProvider,
  IMastraProviderDocument,
  MastraProviderScope,
} from '@/provider/@types/provider';

export interface ProviderOwner {
  scope: MastraProviderScope;
  ownerId: string | null;
}

export interface IMastraProviderModel extends Model<IMastraProviderDocument> {
  getProvider(_id: string): Promise<IMastraProviderDocument>;
  getProviders(owner: ProviderOwner): Promise<IMastraProviderDocument[]>;
  getRuntimeProviders(ownerId?: string): Promise<IMastraProviderDocument[]>;
  saveProvider(
    doc: IMastraProvider,
    owner: ProviderOwner,
  ): Promise<IMastraProviderDocument>;
  removeProvider(_id: string): Promise<{ deletedCount?: number }>;
}

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

const organizationOwnerFilter = {
  $or: [{ ownerId: null }, { ownerId: { $exists: false } }],
};

const ownerFilter = ({ ownerId }: ProviderOwner) =>
  ownerId ? { ownerId } : organizationOwnerFilter;

export const loadProviderClass = (_models: IModels) => {
  class MastraProvider {
    public static async getProvider(_id: string) {
      const p = await _models.MastraProvider.findOne({ _id });
      if (!p) throw new ExpectedError('Provider not found');
      return p;
    }

    public static async getProviders(owner: ProviderOwner) {
      return _models.MastraProvider.find(ownerFilter(owner)).sort({
        provider: 1,
      });
    }

    public static async getRuntimeProviders(ownerId?: string) {
      const providers = await _models.MastraProvider.find({
        isEnabled: true,
        ...(ownerId
          ? {
              $or: [
                { ownerId },
                { ownerId: null },
                { ownerId: { $exists: false } },
              ],
            }
          : organizationOwnerFilter),
      }).sort({ ownerId: 1, provider: 1 });

      const effective = new Map<string, IMastraProviderDocument>();
      for (const provider of providers) {
        effective.set(provider.provider, provider);
      }
      return [...effective.values()];
    }

    public static async saveProvider(
      doc: IMastraProvider,
      owner: ProviderOwner,
    ) {
      const selector = {
        provider: doc.provider,
        ...ownerFilter(owner),
      };
      if (doc.isDefault) {
        await _models.MastraProvider.updateMany(ownerFilter(owner), {
          $set: { isDefault: false },
        });
      }

      const update = buildProviderUpdate({
        ...doc,
        scope: owner.scope,
        ownerId: owner.ownerId,
        ...(owner.scope === 'personal' ? { envKey: undefined } : {}),
      });

      const existing = await _models.MastraProvider.findOne(selector);
      if (existing) {
        return _models.MastraProvider.findOneAndUpdate(
          { _id: existing._id },
          { $set: update },
          { new: true, runValidators: true },
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
