import { IContext } from '~/connectionResolvers';
import { SupplierQueryParams } from '@/supplier/profile/@types/supplier';
import { ICursorPaginateParams, IOffsetPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import { defaultPaginate } from 'erxes-api-shared/utils';
import { generateFilter } from '../../../utils';

export const supplierQueries: Record<string, Resolver> = {
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

  cpBaSupplierDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Supplier.getSupplier(_id);
  },

  cpBaSuppliers: async (
    _root: undefined,
    params: SupplierQueryParams & IOffsetPaginateParams,
    { models }: IContext,
  ) => {
    const filter = generateFilter(params);

    return defaultPaginate(models.Supplier.find(filter), params);
  },
};

supplierQueries.cpBaSuppliers.wrapperConfig = {
  forClientPortal: true,
};

supplierQueries.cpBaSupplierDetail.wrapperConfig = {
  forClientPortal: true,
};