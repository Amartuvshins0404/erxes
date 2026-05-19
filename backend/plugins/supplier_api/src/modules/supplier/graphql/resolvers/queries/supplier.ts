import { IContext } from '~/connectionResolvers';
import { SupplierQueryParams } from '@/supplier/@types/supplier';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';

export const supplierQueries = {
  getSupplier: async (
    _root: undefined,
    _args: any,
    { models, user }: IContext,
  ) => {
    return models.Supplier.getSupplier();
  },

  supplierDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Supplier.getSupplier();
  },

  suppliers: async (
    _root: undefined,
    params: SupplierQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    return models.Supplier.listSuppliers(params);
  },
};
