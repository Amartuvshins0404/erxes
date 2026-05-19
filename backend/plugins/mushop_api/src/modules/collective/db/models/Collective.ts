import { Model } from 'mongoose';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { IModels } from '~/connectionResolvers';
import { collectiveSchema } from '@/collective/db/definitions/collective';
import {
  COLLECTIVE_STATUS,
  CollectiveQueryParams,
  ICollective,
  ICollectiveDocument,
  ICollectiveProfileInput,
  ICollectiveSupplierSyncResult,
} from '@/collective/@types/collective';

export const MIN_COLLECTIVE_SUPPLIERS = 2;

export interface ICollectiveModel extends Model<ICollectiveDocument> {
  getCollective(_id: string): Promise<ICollectiveDocument>;
  listCollectives(
    params: CollectiveQueryParams & ICursorPaginateParams,
  ): Promise<{
    list: ICollectiveDocument[];
    pageInfo: any;
    totalCount: number;
  }>;
  createCollective(doc: ICollective): Promise<ICollectiveDocument>;
  updateSuppliers(
    _id: string,
    supplierIds: string[],
  ): Promise<{
    collective: ICollectiveDocument;
    added: string[];
    removed: string[];
  }>;
  updateSyncProgress(
    _id: string,
    update: {
      status?: string;
      syncResults?: ICollectiveSupplierSyncResult[];
      totalCreated?: number;
      totalFailed?: number;
      lastSyncedAt?: Date;
    },
  ): Promise<ICollectiveDocument | null>;
  syncFromCollective(
    targetSubdomain: string,
    input: ICollectiveProfileInput,
    userId?: string,
  ): Promise<ICollectiveDocument | null>;
  removeCollective(_id: string): Promise<{ ok?: number }>;
}

export const loadCollectiveClass = (models: IModels) => {
  class Collective {
    public static async getCollective(_id: string) {
      const collective = await models.Collective.findOne({ _id }).lean();

      if (!collective) throw new Error('Collective not found');
      
      return collective;
    }

    public static async listCollectives(
      params: CollectiveQueryParams & ICursorPaginateParams,
    ) {
      const { searchValue, status, targetSubdomain, supplierId } = params;
      
      const filter: any = {};

      if (status) filter.status = status;
      
      if (targetSubdomain) filter.targetSubdomain = targetSubdomain;
      
      if (supplierId) filter.supplierIds = supplierId;
      
      if (searchValue) {
        filter.$or = [
          { name: { $regex: searchValue, $options: 'i' } },
          { targetSubdomain: { $regex: searchValue, $options: 'i' } },
        ];
      }

      return cursorPaginate<ICollectiveDocument>({
        model: models.Collective,
        params,
        query: filter,
      });
    }

    public static async createCollective(doc: ICollective) {
      const { targetSubdomain, supplierIds, targetPosToken } = doc || {};

      if (!targetSubdomain?.trim()) {
        throw new Error('targetSubdomain is required');
      }

      if (!supplierIds?.length || supplierIds.length < MIN_COLLECTIVE_SUPPLIERS) {
        throw new Error(
          `At least ${MIN_COLLECTIVE_SUPPLIERS} suppliers are required`,
        );
      }

      const suppliers = await models.Supplier.find({ _id: { $in: supplierIds }}).lean();

      if (suppliers.length !== supplierIds.length) {
        throw new Error('One or more suppliers not found');
      }

      const existing = await models.Collective.findOne({ targetSubdomain }).lean();;

      if (existing) {
        throw new Error(`Collective for subdomain "${targetSubdomain}" already exists`);
      }

      return models.Collective.create({
        targetSubdomain,
        targetPosToken,
        supplierIds,
        status: COLLECTIVE_STATUS.PENDING,
      });
    }

    public static async updateSyncProgress(
      _id: string,
      update: {
        status?: string;
        syncResults?: ICollectiveSupplierSyncResult[];
        totalCreated?: number;
        totalFailed?: number;
        lastSyncedAt?: Date;
      },
    ) {
      return models.Collective.findOneAndUpdate(
        { _id },
        { $set: update },
        { new: true },
      );
    }

    public static async syncFromCollective(
      targetSubdomain: string,
      input: ICollectiveProfileInput,
      userId?: string,
    ) {
      if (!targetSubdomain) {
        throw new Error('targetSubdomain is required');
      }

      return models.Collective.findOneAndUpdate(
        { targetSubdomain },
        {
          $set: {
            ...(input || {}),
            ...(userId ? { ownerUserId: userId } : {}),
          },
          $setOnInsert: {
            targetSubdomain,
            supplierIds: [],
            status: COLLECTIVE_STATUS.PENDING,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async removeCollective(_id: string) {
      return models.Collective.deleteOne({ _id });
    }

    public static async updateSuppliers(_id: string, supplierIds: string[]) {
      if (!_id) {
        throw new Error('_id is required');
      }

      if (!Array.isArray(supplierIds)) {
        throw new Error('supplierIds must be an array');
      }

      const uniqueIds = Array.from(new Set(supplierIds.filter(Boolean)));

      if (uniqueIds.length < MIN_COLLECTIVE_SUPPLIERS) {
        throw new Error(
          `At least ${MIN_COLLECTIVE_SUPPLIERS} suppliers are required`,
        );
      }

      const collective = await models.Collective.findOne({ _id }).lean();

      if (!collective) {
        throw new Error('Collective not found');
      }

      const suppliers = await models.Supplier.find({
        _id: { $in: uniqueIds },
      }).lean();

      if (suppliers.length !== uniqueIds.length) {
        throw new Error('One or more suppliers not found');
      }

      const previous = new Set(collective.supplierIds || []);
      const next = new Set(uniqueIds);
      const added = uniqueIds.filter((id) => !previous.has(id));
      const removed = (collective.supplierIds || []).filter(
        (id) => !next.has(id),
      );

      const updated = await models.Collective.findOneAndUpdate(
        { _id },
        { $set: { supplierIds: uniqueIds } },
        { new: true },
      );

      if (!updated) {
        throw new Error('Failed to update collective suppliers');
      }

      return { collective: updated, added, removed };
    }
  }

  collectiveSchema.loadClass(Collective);

  return collectiveSchema;
};
