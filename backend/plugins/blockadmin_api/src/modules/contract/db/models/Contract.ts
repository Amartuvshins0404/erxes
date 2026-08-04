import { IContractDocument } from '@/contract/@types/contract';
import { Model } from 'mongoose';

import { IContract } from '@/contract/@types/contract';
import { contractSchema } from '@/contract/db/definitions/contract';
import { IModels } from '~/connectionResolvers';

export interface IContractModel extends Model<IContractDocument> {
  getContract(subdomain: string, entityId: string): Promise<IContractDocument>;
  createContract(input: IContract): Promise<IContractDocument>;
  updateContract(
    subdomain: string,
    entityId: string,
    input: IContract,
  ): Promise<IContractDocument>;
  markContractSigned(
    subdomain: string,
    entityId: string,
    data: { customerId?: string; signedAt: Date },
  ): Promise<IContractDocument>;
  deleteContract(
    subdomain: string,
    entityId: string,
  ): Promise<IContractDocument | null>;
}

export const loadContractClass = (models: IModels) => {
  class Contract {
    public static async getContract(subdomain: string, entityId: string) {
      const contract = await models.Contract.findOne({
        subdomain,
        entityId,
      }).lean();

      if (!contract) {
        throw new Error('Contract not found');
      }

      return contract;
    }

    public static async createContract(input: IContract) {
      return models.Contract.create(input);
    }

    public static async updateContract(
      subdomain: string,
      entityId: string,
      input: IContract,
    ) {
      const { _id } = await models.Contract.getContract(subdomain, entityId);

      return models.Contract.findOneAndUpdate({ _id }, input, {
        new: true,
      });
    }

    public static async markContractSigned(
      subdomain: string,
      entityId: string,
      data: { customerId?: string; signedAt: Date },
    ) {
      const { _id } = await models.Contract.getContract(subdomain, entityId);

      return models.Contract.findOneAndUpdate(
        { _id },
        { $set: data },
        { new: true },
      );
    }

    public static async deleteContract(subdomain: string, entityId: string) {
      const { _id } = await models.Contract.getContract(subdomain, entityId);

      return models.Contract.findOneAndDelete({ _id });
    }
  }

  contractSchema.loadClass(Contract);

  return contractSchema;
};
