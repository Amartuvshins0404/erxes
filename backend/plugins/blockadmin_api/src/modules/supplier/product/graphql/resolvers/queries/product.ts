import { IContext } from '~/connectionResolvers';
import { ProductQueryParams } from '@/supplier/product/@types/product';
import { BA_PRODUCT_STATE } from '@/supplier/product/db/definitions/product';
import {
  ICursorPaginateParams,
  IOffsetPaginateParams,
  Resolver,
} from 'erxes-api-shared/core-types';
import {
  cursorPaginateAggregation,
  defaultPaginate,
} from 'erxes-api-shared/utils';

export const productQueries: Record<string, Resolver> = {
  baProducts: async (
    _root: undefined,
    params: ProductQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    const { supplierId, categoryId, status, searchValue } = params;

    const filter: any = { state: BA_PRODUCT_STATE.ACTIVE };

    if (supplierId) {
      const supplier = await models.Supplier.getSupplier(supplierId);

      filter.subdomain = supplier.subdomain;
    }

    if (categoryId) filter.categoryId = categoryId;

    if (status) filter.status = status;

    if (searchValue) {
      filter.$or = [
        { name: { $regex: searchValue, $options: 'i' } },
        { code: { $regex: searchValue, $options: 'i' } },
      ];
    }

    const matchStage = Object.keys(filter).length ? [{ $match: filter }] : [];

    const baseOrderBy =
      params.orderBy && Object.keys(params.orderBy).length
        ? params.orderBy
        : ({ _statusOrder: 1, createdAt: -1 } as Record<string, any>);

    const orderBy = { ...baseOrderBy, _id: 1 } as Record<string, any>;

    return cursorPaginateAggregation({
      model: models.SupplierProduct,
      params: { ...params, orderBy },
      formatter: { createdAt: 'date' },
      pipeline: [
        ...matchStage,
        {
          $addFields: {
            _statusOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 'pending'] }, then: 0 },
                  { case: { $eq: ['$status', 'approved'] }, then: 1 },
                  { case: { $eq: ['$status', 'rejected'] }, then: 2 },
                ],
                default: 3,
              },
            },
          },
        },
      ],
    });
  },

  baProductDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.SupplierProduct.getProduct(_id);
  },

  cpBaProducts: async (
    _root: undefined,
    params: ProductQueryParams & IOffsetPaginateParams,
    { models }: IContext,
  ) => {
    const { supplierId, categoryId, status, searchValue } = params;

    const filter: any = { state: BA_PRODUCT_STATE.ACTIVE };

    if (supplierId) {
      const supplier = await models.Supplier.getSupplier(supplierId);

      filter.subdomain = supplier.subdomain;
    }

    if (categoryId) filter.categoryId = categoryId;

    if (status) filter.status = status;

    if (searchValue) {
      filter.$or = [
        { name: { $regex: searchValue, $options: 'i' } },
        { code: { $regex: searchValue, $options: 'i' } },
      ];
    }

    return defaultPaginate(models.SupplierProduct.find(filter), params);
  },

  cpBaProductDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.SupplierProduct.getProduct(_id);
  },
};

productQueries.cpBaProducts.wrapperConfig = {
  forClientPortal: true,
};

productQueries.cpBaProductDetail.wrapperConfig = {
  forClientPortal: true,
};