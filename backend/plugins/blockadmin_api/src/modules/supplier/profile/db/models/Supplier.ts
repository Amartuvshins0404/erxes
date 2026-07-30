import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { supplierSchema } from '@/supplier/profile/db/definitions/supplier';
import {
  IBaSupplierDocument,
  ISupplier,
  SupplierQueryParams,
} from '@/supplier/profile/@types/supplier';
import { SUPPLIER_VERIFICATION_STATUS } from '@/supplier/constants';
import { generateFilter } from '@/supplier/profile/utils';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';

export interface ISupplierModel extends Model<IBaSupplierDocument> {
  getSupplier(_id: string): Promise<IBaSupplierDocument>;
  listSuppliers(params: SupplierQueryParams & ICursorPaginateParams): Promise<{
    list: IBaSupplierDocument[];
    pageInfo: any;
    totalCount: number;
  }>;
  updateVerificationStatus(
    _id: string,
    status: string,
    note?: string,
  ): Promise<IBaSupplierDocument | null>;
  updateTierLevel(
    _id: string,
    tierLevel: number,
  ): Promise<IBaSupplierDocument | null>;
  syncFromSupplier(
    entityId: string,
    subdomain: string,
    input: ISupplier,
  ): Promise<IBaSupplierDocument | null>;
  removeSupplier(_id: string): Promise<{ ok?: number }>;
}

export const loadSupplierClass = (models: IModels) => {
  class Supplier {
    public static async getSupplier(_id: string) {
      const supplier = await models.Supplier.findOne({ _id }).lean();
      if (!supplier) throw new Error('Supplier not found');
      return supplier;
    }

    public static async listSuppliers(
      params: SupplierQueryParams & ICursorPaginateParams,
    ) {
      const filter = generateFilter(params);
      return cursorPaginate<IBaSupplierDocument>({
        model: models.Supplier,
        params,
        query: filter,
      });
    }

    public static async updateVerificationStatus(
      _id: string,
      status: string,
      note?: string,
    ) {
      if (!SUPPLIER_VERIFICATION_STATUS.ALL.includes(status)) {
        throw new Error('Invalid verification status');
      }
      return models.Supplier.findOneAndUpdate(
        { _id },
        {
          $set: { verificationStatus: status, verificationNote: note ?? null },
        },
        { new: true },
      );
    }

    public static async updateTierLevel(_id: string, tierLevel: number) {
      if (!Number.isInteger(tierLevel) || tierLevel < 0) {
        throw new Error('tierLevel must be a non-negative integer');
      }
      return models.Supplier.findOneAndUpdate(
        { _id },
        { $set: { tierLevel } },
        { new: true },
      );
    }

    public static async syncFromSupplier(
      entityId: string,
      subdomain: string,
      input: ISupplier,
    ) {
      const { code, ...supplier } = input || {};

      return models.Supplier.findOneAndUpdate(
        { subdomain, entityId },
        {
          $set: { ...supplier },
          $setOnInsert: { subdomain, entityId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async removeSupplier(_id: string) {
      return models.Supplier.deleteOne({ _id });
    }
  }

  supplierSchema.loadClass(Supplier);

  return supplierSchema;
};
