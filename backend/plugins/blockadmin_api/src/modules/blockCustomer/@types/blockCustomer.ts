import { Document } from 'mongoose';
import { IBlock } from '~/types';

export interface IBlockCustomer extends IBlock {
  customerId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface IBlockCustomerDocument extends IBlockCustomer, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
