import { Model } from 'mongoose';
import { IContractPaymentTransactionDocument } from '@/contract/@types/transaction';
import { contractPaymentTransactionSchema } from '@/contract/db/definitions/transaction';
import { IModels } from '~/connectionResolvers';

export interface IContractPaymentTransactionModel
  extends Model<IContractPaymentTransactionDocument> {}

export const loadContractPaymentTransactionClass = (_models: IModels) => {
  class ContractPaymentTransaction {}

  contractPaymentTransactionSchema.loadClass(ContractPaymentTransaction);
  return contractPaymentTransactionSchema;
};
