import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { customerSyncSchema } from '@/admin/db/definitions/customerSync';
import { ICustomerSyncDocument } from '@/admin/@types/customerSync';

export interface ICustomerSyncModel extends Model<ICustomerSyncDocument> {
  getCustomerSync(customerId: string): Promise<ICustomerSyncDocument | null>;
  setCustomerSync(
    customerId: string,
    blockAdminId: string,
  ): Promise<ICustomerSyncDocument>;
}

export const loadCustomerSyncClass = (models: IModels) => {
  class CustomerSync {
    public static async getCustomerSync(customerId: string) {
      return models.CustomerSync.findOne({ customerId });
    }

    public static async setCustomerSync(
      customerId: string,
      blockAdminId: string,
    ) {
      return models.CustomerSync.findOneAndUpdate(
        { customerId },
        { $set: { customerId, blockAdminId } },
        { upsert: true, new: true },
      );
    }
  }

  customerSyncSchema.loadClass(CustomerSync);

  return customerSyncSchema;
};
