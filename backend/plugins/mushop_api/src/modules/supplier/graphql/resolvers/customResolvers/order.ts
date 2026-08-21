import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IOrderDocument } from '@/supplier/@types/order';

export const MushopOrder = {
  supplier: async ({ subdomain }: IOrderDocument, _args: undefined, { models }: IContext) => {
    if (!subdomain) return null;
    return models.Supplier.findOne({ subdomain }).lean();
  },

  customer: async (
    doc: IOrderDocument,
    _args: undefined,
    { subdomain }: IContext,
  ) => {
    // The top-level `customerId` is only set when the request carried a
    // resolvable cp-user/customer at forward time; older/kiosk orders only
    // have it embedded in the raw payload itself.
    const customerId = doc.customerId || doc.order?.customerId;

    if (!customerId) return null;

    return sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'customers',
      action: 'findOne',
      input: { query: { _id: customerId } },
      defaultValue: null,
    });
  },

  order: async (doc: IOrderDocument, _args: undefined, { models }: IContext) => {
    const payload = doc.order;
    const items = payload?.items;

    if (!doc.subdomain || !Array.isArray(items) || !items.length) {
      return payload;
    }

    const enrichedItems = await Promise.all(
      items.map(async (item: Record<string, any>) => {
        if (item.productName) return item;

        const product = await models.Product.findOne({
          $or: [{ _id: item.productId }, { entityId: item.productId }],
          subdomain: doc.subdomain,
        }).lean();

        return product ? { ...item, productName: product.name } : item;
      }),
    );

    return { ...payload, items: enrichedItems };
  },
};
