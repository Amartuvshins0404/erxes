import { Model } from 'mongoose';

import {
  IContractPaymentDocument,
  IContractPaymentSyncRow,
} from '@/contract/@types/payment';
import { contractPaymentSchema } from '@/contract/db/definitions/payment';
import { IModels } from '~/connectionResolvers';

export interface IContractPaymentModel
  extends Model<IContractPaymentDocument> {
  replaceForContract(
    subdomain: string,
    contractEntityId: string,
    rows: IContractPaymentSyncRow[],
  ): Promise<IContractPaymentDocument[]>;
}

export const loadContractPaymentClass = (models: IModels) => {
  class ContractPayment {
    // Mirrors block_api's regenerate-on-signed semantics: the whole
    // schedule for a contract is replaced wholesale, not merged row by row.
    public static async replaceForContract(
      subdomain: string,
      contractEntityId: string,
      rows: IContractPaymentSyncRow[],
    ) {
      await models.ContractPayment.deleteMany({
        subdomain,
        contractId: contractEntityId,
      });

      if (!rows.length) {
        return [];
      }

      return models.ContractPayment.insertMany(
        rows.map(({ _id, ...row }) => ({
          ...row,
          subdomain,
          entityId: _id,
          contractId: contractEntityId,
        })),
      );
    }
  }

  contractPaymentSchema.loadClass(ContractPayment);

  return contractPaymentSchema;
};
