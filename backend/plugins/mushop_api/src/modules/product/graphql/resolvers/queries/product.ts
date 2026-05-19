import { IContext } from '~/connectionResolvers';
import { ProductQueryParams } from '@/product/@types/product';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { cursorPaginateAggregation } from 'erxes-api-shared/utils';

export const productQueries = {
  mushopProducts: async (
    _root: undefined,
    params: ProductQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    const { supplierId, categoryId, status, searchValue } = params;

    const filter: any = {};

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
      model: models.MushopProduct,
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

  mushopProductDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.MushopProduct.getProduct(_id);
  },
};
