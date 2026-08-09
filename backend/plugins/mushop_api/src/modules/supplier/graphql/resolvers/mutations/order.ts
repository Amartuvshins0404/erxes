import { IContext } from '~/connectionResolvers';
import { ORDER_STATUS } from '@/supplier/@types/order';
import { sendSupplierMessage } from '~/utils/sendSupplierMessage';

export const orderMutations = {
  mushopResyncOrder: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopResyncOrder');

    const order = await models.Order.findOne({ _id });

    if (!order) throw new Error('Order not found');
    if (!order.subdomain) throw new Error('Order has no supplier to resync to');

    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new Error('Cannot resync a cancelled order');
    }

    const supplier = await models.Supplier.findOne({
      subdomain: order.subdomain,
    }).lean<{ posToken?: string }>();

    if (!supplier?.posToken) {
      throw new Error('Supplier has no posToken configured');
    }

    try {
      const res = await sendSupplierMessage<{
        order?: Record<string, any>;
      }>({
        subdomain: order.subdomain,
        action: 'order',
        payload: { posToken: supplier.posToken, order: order.order },
      });

      await models.Order.markResult(_id, {
        ok: true,
        orderId: res?.order?._id,
        order: res?.order ?? null,
      });
    } catch (e: any) {
      await models.Order.markResult(_id, { ok: false, error: e.message });
      throw new Error(`Failed to resync order: ${e.message}`);
    }

    return models.Order.findOne({ _id });
  },
};
