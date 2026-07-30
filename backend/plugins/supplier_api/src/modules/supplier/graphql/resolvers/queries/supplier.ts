import { markResolvers, sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { SupplierQueryParams } from '@/supplier/@types/supplier';
import { ICursorPaginateParams, Resolver } from 'erxes-api-shared/core-types';

export const supplierQueries: Record<string, Resolver> = {
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

export const supplierClientPortalQueries: Record<string, Resolver> = {
  cpSupplierUsers: async (
    _root: undefined,
    { positionIds }: { positionIds?: string[] },
    { subdomain }: IContext,
  ) => {
    const query = positionIds?.length
      ? { positionIds: { $in: positionIds } }
      : {};

    const users = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'users',
      action: 'find',
      input: { query },
      defaultValue: [],
    });

    return (users || []).map((user: { _id: string }) => ({ _id: user._id }));
  },
};

markResolvers(supplierClientPortalQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});