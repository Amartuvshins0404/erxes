import { IContext } from '~/connectionResolvers';
import { ProductQueryParams } from '@/product/@types/product';
import { IOffsetPaginateParams } from 'erxes-api-shared/core-types';
import { markResolvers, paginate } from 'erxes-api-shared/utils';
import { checkMembership } from '~/utils';

export const cpProductQueries = {
  cpMushopProducts: async (
    _root: undefined,
    params: ProductQueryParams & IOffsetPaginateParams,
    { models, subdomain, cpUser }: IContext,
  ) => {
    const isMembership = await checkMembership({
      models,
      subdomain,
      cpUserId: cpUser?._id,
    });

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

    if (!isMembership) {
      return paginate(
        models.Product.find(filter).select('-unitPrice'),
        params,
      );
    }

    return paginate(models.Product.find(filter), params);
  },

  cpMushopProductDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, subdomain, cpUser }: IContext,
  ) => {
    const isMembership = await checkMembership({
      models,
      subdomain,
      cpUserId: cpUser?._id,
    });

    if (!isMembership) {
      return models.Product.findOne({ _id }).select('-unitPrice');
    }

    return models.Product.getProduct(_id);
  },
};

markResolvers(cpProductQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});
