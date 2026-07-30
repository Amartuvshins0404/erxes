import { Model } from 'mongoose';
import { EventDispatcherReturn } from 'erxes-api-shared/core-modules';
import { IModels } from '~/connectionResolvers';
import { supplierSchema } from '@/supplier/db/definitions/supplier';
import {
  IMushopSupplierDocument,
  SupplierQueryParams,
} from '@/supplier/@types/supplier';
import { SUPPLIER_CODE, SUPPLIER_VERIFICATION_STATUS } from '~/constants';
import { locationCode } from '@/supplier/utils/supplierCode';
import { generateFilter } from '@/supplier/utils';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import {
  buildSupplierStatusChangedLog,
  buildSupplierProfileUpdatedLog,
  buildSupplierRegisteredLog,
} from '~/meta/activity-log/supplier';

export interface ISupplierModel extends Model<IMushopSupplierDocument> {
  getSupplier(_id: string): Promise<IMushopSupplierDocument>;
  listSuppliers(params: SupplierQueryParams & ICursorPaginateParams): Promise<{
    list: IMushopSupplierDocument[];
    pageInfo: any;
    totalCount: number;
  }>;
  updateVerificationStatus(
    _id: string,
    status: string,
    note?: string,
  ): Promise<IMushopSupplierDocument | null>;
  updateTierLevel(
    _id: string,
    tierLevel: number,
  ): Promise<IMushopSupplierDocument | null>;
  syncFromSupplier(
    entityId: string,
    subdomain: string,
    input: any,
    userId?: string,
  ): Promise<IMushopSupplierDocument | null>;
  generateCode(input?: any): Promise<string>;
  removeSupplier(_id: string): Promise<{ ok?: number }>;
}

export const loadSupplierClass = (
  models: IModels,
  { createActivityLog }: EventDispatcherReturn,
) => {
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
      return cursorPaginate<IMushopSupplierDocument>({
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
      const supplier = await models.Supplier.findOneAndUpdate(
        { _id },
        {
          $set: { verificationStatus: status, verificationNote: note ?? null },
        },
        { new: true },
      );

      if (supplier) {
        createActivityLog(
          buildSupplierStatusChangedLog(supplier, status, note),
        );
      }

      return supplier;
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

    public static async generateCode(input?: any) {
      const details = input?.address?.details || input?.address?.address || {};
      const location = locationCode(details.city, details.city_district);

      const seq = await models.Counter.next(
        `${SUPPLIER_CODE.COUNTER_PREFIX}:${location}`,
      );

      return `${location}${seq}`;
    }

    public static async syncFromSupplier(
      entityId: string,
      subdomain: string,
      input: any,
      userId?: string,
    ) {
      const existing = await models.Supplier.findOne({
        subdomain,
        entityId,
      }).lean();

      const { code: _ignoredCode, ...cleanInput } = input || {};

      const supplier = await models.Supplier.findOneAndUpdate(
        { subdomain, entityId },
        {
          $set: {
            ...cleanInput,
            ...(userId ? { ownerUserId: userId } : {}),
          },
          $setOnInsert: {
            subdomain,
            entityId,
            ...(existing
              ? {}
              : { code: await models.Supplier.generateCode(input) }),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (supplier) {
        createActivityLog(
          existing
            ? buildSupplierProfileUpdatedLog(supplier, input)
            : buildSupplierRegisteredLog(supplier),
        );
      }

      return supplier;
    }

    public static async removeSupplier(_id: string) {
      return models.Supplier.deleteOne({ _id });
    }
  }

  supplierSchema.loadClass(Supplier);

  return supplierSchema;
};
