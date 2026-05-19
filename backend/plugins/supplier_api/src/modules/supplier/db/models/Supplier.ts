import { Model } from 'mongoose';
import { EventDispatcherReturn } from 'erxes-api-shared/core-modules';
import { IModels } from '~/connectionResolvers';
import { supplierSchema } from '@/supplier/db/definitions/supplier';
import {
  ISupplier,
  ISupplierDocument,
  SupplierQueryParams,
} from '@/supplier/@types/supplier';
import { SUPPLIER_VERIFICATION_STATUS } from '~/constants';
import { generateFilter } from '@/supplier/utils';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { buildSupplierVerificationChangedLog } from '~/meta/activity-log/supplier';

// Fields a supplier user is NOT allowed to set on themselves
const ADMIN_ONLY_FIELDS = [];

const normalizeSupplierAddress = (address: any) => {
  if (!address || typeof address !== 'object') return address;

  const details = address.details ?? address.address;
  const next = { ...address, details };

  // Remove legacy key to enforce new shape in DB
  if ('address' in next) {
    delete next.address;
  }

  return next;
};

const stripAdminFields = (doc: ISupplier): ISupplier => {
  const clean: ISupplier = { ...doc };
  for (const key of ADMIN_ONLY_FIELDS) {
    delete (clean as any)[key];
  }

  if (clean.address) {
    (clean as any).address = normalizeSupplierAddress(clean.address as any);
  }

  return clean;
};

export interface ISupplierModel extends Model<ISupplierDocument> {
  getSupplier(): Promise<ISupplierDocument>;
  listSuppliers(
    params: SupplierQueryParams & ICursorPaginateParams,
  ): Promise<{ list: ISupplierDocument[]; pageInfo: any; totalCount: number }>;
  createGetSupplier(userId: string, doc: ISupplier): Promise<ISupplierDocument>;
  updateSupplier(userId: string, doc: ISupplier): Promise<ISupplierDocument>;
  updateVerificationStatus(
    _id: string,
    status: string,
    note?: string,
  ): Promise<ISupplierDocument | null>;
  updateTierLevel(
    _id: string,
    tierLevel: number,
  ): Promise<ISupplierDocument | null>;
  removeSupplier(_id: string): Promise<{ ok?: number }>;
}

export const loadSupplierClass = (
  models: IModels,
  { createActivityLog }: EventDispatcherReturn,
) => {
  class Supplier {
    public static async getSupplier() {
      const supplier = await models.Supplier.findOne().lean();

      if (!supplier) throw new Error('Supplier not found');

      return supplier;
    }

    public static async listSuppliers(
      params: SupplierQueryParams & ICursorPaginateParams,
    ) {
      const filter = generateFilter(params);
      return cursorPaginate<ISupplierDocument>({
        model: models.Supplier,
        params,
        query: filter,
      });
    }

    public static async createGetSupplier(userId: string, doc: ISupplier) {
      const existing = await models.Supplier.findOne({});
      if (existing) {
        throw new Error('Supplier profile already exists for this user');
      }
      return models.Supplier.create({
        ...stripAdminFields(doc),
        verificationStatus: SUPPLIER_VERIFICATION_STATUS.PENDING,
      });
    }

    public static async updateSupplier(userId: string, doc: ISupplier) {
      const existing = await models.Supplier.findOne({});

      if (!existing) {
        // First-time save: create instead.
        return models.Supplier.create({
          ...stripAdminFields(doc),
          verificationStatus: SUPPLIER_VERIFICATION_STATUS.PENDING,
        });
      }
      return models.Supplier.findOneAndUpdate(
        { _id: existing._id },
        { $set: stripAdminFields(doc) },
        { new: true },
      );
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
          buildSupplierVerificationChangedLog(supplier, status, note),
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

    public static async removeSupplier(_id: string) {
      return models.Supplier.deleteOne({ _id });
    }
  }

  supplierSchema.loadClass(Supplier);

  return supplierSchema;
};
