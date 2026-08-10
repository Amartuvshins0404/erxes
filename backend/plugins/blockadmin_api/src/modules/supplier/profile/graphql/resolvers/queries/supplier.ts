import { IContext } from '~/connectionResolvers';
import { SupplierQueryParams } from '@/supplier/profile/@types/supplier';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';

export const supplierQueries = {
  baSupplierDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Supplier.getSupplier(_id);
  },

  baSuppliers: async (
    _root: undefined,
    params: SupplierQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    return models.Supplier.listSuppliers(params);
  },
};

markResolvers(supplierQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
})