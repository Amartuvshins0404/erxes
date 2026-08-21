import { Model } from 'mongoose';

import { IBlockCustomerDocument } from '@/blockCustomer/@types/blockCustomer';
import { customerSchema } from '@/blockCustomer/db/definitions/blockCustomer';
import { IModels } from '~/connectionResolvers';

export interface IBlockCustomerModel extends Model<IBlockCustomerDocument> {}

export const loadBlockCustomerClass = (_models: IModels) => {
  class BlockCustomer {}

  customerSchema.loadClass(BlockCustomer);

  return customerSchema;
};
