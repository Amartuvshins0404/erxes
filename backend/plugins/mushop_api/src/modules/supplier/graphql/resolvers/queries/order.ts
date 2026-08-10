import { FilterQuery } from 'mongoose';
import { IContext } from '~/connectionResolvers';
import { IOrderDocument } from '@/supplier/@types/order';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';

type OrderQueryParams = {
  status?: string;
  supplierId?: string;
  customerId?: string;
  entityId?: string;
  dateFilters?: string;
};

export const orderQueries = {
  mushopOrders: async (
    _root: undefined,
    params: OrderQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    const { status, supplierId, customerId, entityId, dateFilters, ...cursorParams } = params;

    const filter: FilterQuery<IOrderDocument> = {};

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (entityId) filter.entityId = entityId;

    if (supplierId) {
      const supplier = await models.Supplier.getSupplier(supplierId);
      filter.subdomain = supplier.subdomain;
    }

    if (dateFilters) {
      let dateFilter: Record<string, { gte?: string; lte?: string }>;
      try {
        dateFilter = JSON.parse(dateFilters);
      } catch {
        throw new Error('Invalid dateFilters: must be valid JSON');
      }

      for (const key of Object.keys(dateFilter)) {
        const { gte, lte } = dateFilter[key];
        const range: Record<string, Date> = {};
        if (gte) range.$gte = new Date(gte);
        if (lte) range.$lte = new Date(lte);
        (filter as Record<string, unknown>)[key] = range;
      }
    }

    return cursorPaginate<IOrderDocument>({
      model: models.Order,
      params: { ...cursorParams, orderBy: { createdAt: -1 } },
      query: filter,
    });
  },

  mushopOrderDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const order = await models.Order.findOne({ _id }).lean();
    if (!order) throw new Error('Order not found');
    return order;
  },
};
