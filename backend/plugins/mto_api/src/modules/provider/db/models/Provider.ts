import {
  IProvider,
  IProviderDocument,
  ProviderStatus,
} from '@/provider/@types/provider';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { providerSchema } from '../definitions/provider';

export interface IProviderModel extends Model<IProviderDocument> {
  createProvider(doc: IProvider): Promise<IProviderDocument>;
  updateProvider(
    _id: string,
    doc: Partial<IProvider>,
  ): Promise<IProviderDocument>;
  approveProvider(_id: string, approvedBy: string): Promise<IProviderDocument>;
  rejectProvider(
    _id: string,
    rejectionReason: string,
    rejectedBy: string,
  ): Promise<IProviderDocument>;
  removeProviders(ids: string[]): Promise<{ n: number; ok: number }>;
  findByAssociation(associationId: string): Promise<IProviderDocument[]>;
  findApprovedProviders(): Promise<IProviderDocument[]>;
}

export const loadProviderClass = (models: IModels) => {
  class Provider {
    public static async createProvider(doc: IProvider) {
      return await models.Provider.create({
        ...doc,
        status: doc.status || ProviderStatus.PENDING,
        isActive: doc.isActive ?? true,
        createdAt: new Date(),
      });
    }

    public static async updateProvider(_id: string, doc: Partial<IProvider>) {
      return await models.Provider.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...doc,
            modifiedAt: new Date(),
          },
        },
        { new: true },
      );
    }

    public static async approveProvider(_id: string, approvedBy: string) {
      return await models.Provider.findOneAndUpdate(
        { _id },
        {
          $set: {
            status: ProviderStatus.APPROVED,
            approvedAt: new Date(),
            approvedBy,
            modifiedAt: new Date(),
          },
        },
        { new: true },
      );
    }

    public static async rejectProvider(
      _id: string,
      rejectionReason: string,
      rejectedBy: string,
    ) {
      return await models.Provider.findOneAndUpdate(
        { _id },
        {
          $set: {
            status: ProviderStatus.REJECTED,
            rejectionReason,
            rejectedBy,
            modifiedAt: new Date(),
          },
        },
        { new: true },
      );
    }

    public static async removeProviders(ids: string[]) {
      return models.Provider.deleteMany({ _id: { $in: ids } });
    }

    public static async findByAssociation(associationId: string) {
      return models.Provider.find({
        associationIds: associationId,
        status: ProviderStatus.APPROVED,
        isActive: true,
      });
    }

    public static async findApprovedProviders() {
      return models.Provider.find({
        status: ProviderStatus.APPROVED,
        isActive: true,
      });
    }
  }

  providerSchema.loadClass(Provider);

  return providerSchema;
};
