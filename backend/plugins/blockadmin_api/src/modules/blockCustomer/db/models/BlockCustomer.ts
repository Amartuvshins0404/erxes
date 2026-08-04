import { Model } from 'mongoose';

import {
  IBlockCustomer,
  IBlockCustomerDocument,
} from '@/blockCustomer/@types/blockCustomer';
import { customerSchema } from '@/blockCustomer/db/definitions/blockCustomer';
import { IModels } from '~/connectionResolvers';

export interface IBlockCustomerModel extends Model<IBlockCustomerDocument> {
  getCustomer(
    subdomain: string,
    entityId: string,
  ): Promise<IBlockCustomerDocument>;
  upsertCustomer(
    subdomain: string,
    entityId: string,
    input: IBlockCustomer,
  ): Promise<IBlockCustomerDocument>;
}

export const loadBlockCustomerClass = (models: IModels) => {
  class BlockCustomer {
    public static async getCustomer(subdomain: string, entityId: string) {
      const customer = await models.BlockCustomer.findOne({
        subdomain,
        entityId,
      }).lean();

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    }

    public static async upsertCustomer(
      subdomain: string,
      entityId: string,
      input: IBlockCustomer,
    ) {
      return models.BlockCustomer.findOneAndUpdate(
        { subdomain, entityId },
        { $set: { ...input, subdomain, entityId } },
        { upsert: true, new: true },
      );
    }
  }

  customerSchema.loadClass(BlockCustomer);

  return customerSchema;
};
