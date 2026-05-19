import { Model } from 'mongoose';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { IModels } from '~/connectionResolvers';
import { collectivePackageSchema } from '@/collective-package/db/definitions/collectivePackage';
import {
  CollectivePackageQueryParams,
  COLLECTIVE_PACKAGE_STATUS,
  ICollectivePackage,
  ICollectivePackageDocument,
} from '@/collective-package/@types/collectivePackage';

export interface ICollectivePackageCreateInput
  extends Omit<ICollectivePackage, 'collectiveId' | 'status'> {
  status?: string;
}

export interface ICollectivePackageModel
  extends Model<ICollectivePackageDocument> {
  getCollectivePackage(_id: string): Promise<ICollectivePackageDocument>;
  listCollectivePackages(
    params: CollectivePackageQueryParams & ICursorPaginateParams,
  ): Promise<{
    list: ICollectivePackageDocument[];
    pageInfo: any;
    totalCount: number;
  }>;
  createCollectivePackage(
    targetSubdomain: string,
    doc: ICollectivePackageCreateInput,
  ): Promise<ICollectivePackageDocument>;
  updatePackageStatus(
    targetSubdomain: string,
    _id: string,
    status: string,
  ): Promise<ICollectivePackageDocument>;
  editPackage(
    targetSubdomain: string,
    _id: string,
    patch: Partial<{
      name: string;
      description: string;
      coverImage: string;
      price: number;
      productIds: string[];
    }>,
  ): Promise<ICollectivePackageDocument>;
}

export const loadCollectivePackageClass = (models: IModels) => {
  class CollectivePackage {
    public static async getCollectivePackage(_id: string) {
      const pkg = await models.CollectivePackage.findOne({ _id }).lean();

      if (!pkg) throw new Error('Collective package not found');

      return pkg;
    }

    public static async listCollectivePackages(
      params: CollectivePackageQueryParams & ICursorPaginateParams,
    ) {
      const { collectiveId, searchValue, status } = params;

      if (!collectiveId) {
        throw new Error('collectiveId is required');
      }

      const filter: any = { collectiveId };

      if (status) filter.status = status;

      if (searchValue) {
        filter.$or = [
          { name: { $regex: searchValue, $options: 'i' } },
          { description: { $regex: searchValue, $options: 'i' } },
        ];
      }

      return cursorPaginate<ICollectivePackageDocument>({
        model: models.CollectivePackage,
        params,
        query: filter,
      });
    }

    public static async createCollectivePackage(
      targetSubdomain: string,
      doc: ICollectivePackageCreateInput,
    ) {
      const { productIds = [], name, price, status, posToken } =
        doc || ({} as ICollectivePackageCreateInput);

      if (!targetSubdomain) {
        throw new Error('targetSubdomain is required');
      }

      if (!name?.trim()) {
        throw new Error('name is required');
      }

      if (!posToken?.trim()) {
        throw new Error('posToken is required');
      }

      if (!productIds.length) {
        throw new Error('At least one product is required');
      }

      const collective = await models.Collective.findOne({ targetSubdomain }).lean();

      if (!collective) {
        throw new Error(`Collective not found for subdomain "${targetSubdomain}"`);
      }

      if (price != null && (Number.isNaN(price) || price < 0)) {
        throw new Error('price must be a non-negative number');
      }

      return models.CollectivePackage.create({
        ...doc,
        collectiveId: collective._id,
        status: status || COLLECTIVE_PACKAGE_STATUS.DRAFT,
      });
    }

    public static async editPackage(
      targetSubdomain: string,
      _id: string,
      patch: Partial<{
        name: string;
        description: string;
        coverImage: string;
        price: number;
        productIds: string[];
      }>,
    ) {
      if (!targetSubdomain) {
        throw new Error('targetSubdomain is required');
      }

      if (!_id) {
        throw new Error('_id is required');
      }

      const pkg = await models.CollectivePackage.findOne({ _id }).lean();

      if (!pkg) {
        throw new Error('Collective package not found');
      }

      const collective = await models.Collective.findOne({
        _id: pkg.collectiveId,
      }).lean();

      if (!collective || collective.targetSubdomain !== targetSubdomain) {
        throw new Error('Package does not belong to this collective');
      }

      const update: Record<string, any> = {};

      if (patch.name !== undefined) {
        if (!patch.name.trim()) throw new Error('name cannot be empty');
        update.name = patch.name;
      }

      if (patch.description !== undefined) {
        update.description = patch.description;
      }

      if (patch.coverImage !== undefined) {
        update.coverImage = patch.coverImage;
      }

      if (patch.price !== undefined) {
        if (
          patch.price !== null &&
          (Number.isNaN(patch.price) || patch.price < 0)
        ) {
          throw new Error('price must be a non-negative number');
        }
        update.price = patch.price;
      }

      if (patch.productIds !== undefined) {
        const unique = Array.from(
          new Set((patch.productIds || []).filter(Boolean)),
        );
        if (!unique.length) {
          throw new Error('At least one product is required');
        }
        update.productIds = unique;
      }

      if (!Object.keys(update).length) {
        return models.CollectivePackage.findOne({ _id }).lean() as any;
      }

      const updated = await models.CollectivePackage.findOneAndUpdate(
        { _id },
        { $set: update },
        { new: true },
      );

      if (!updated) {
        throw new Error('Failed to update collective package');
      }

      return updated;
    }

    public static async updatePackageStatus(
      targetSubdomain: string,
      _id: string,
      status: string,
    ) {
      if (!targetSubdomain) {
        throw new Error('targetSubdomain is required');
      }

      if (!_id) {
        throw new Error('_id is required');
      }

      if (!status || !COLLECTIVE_PACKAGE_STATUS.ALL.includes(status)) {
        throw new Error(
          `status must be one of: ${COLLECTIVE_PACKAGE_STATUS.ALL.join(', ')}`,
        );
      }

      const pkg = await models.CollectivePackage.findOne({ _id }).lean();

      if (!pkg) {
        throw new Error('Collective package not found');
      }

      const collective = await models.Collective.findOne({
        _id: pkg.collectiveId,
      }).lean();

      if (!collective || collective.targetSubdomain !== targetSubdomain) {
        throw new Error('Package does not belong to this collective');
      }

      const updated = await models.CollectivePackage.findOneAndUpdate(
        { _id },
        { $set: { status } },
        { new: true },
      );

      if (!updated) {
        throw new Error('Failed to update collective package');
      }

      return updated;
    }
  }

  collectivePackageSchema.loadClass(CollectivePackage);

  return collectivePackageSchema;
};
