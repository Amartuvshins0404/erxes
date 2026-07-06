import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { orderSchema } from '@/supplier/db/definitions/order';
import { IOrder, IOrderDocument, ORDER_STATUS } from '@/supplier/@types/order';

export interface IOrderModel extends Model<IOrderDocument> {
  logForward(doc: IOrder): Promise<IOrderDocument>;
  markResult(
    _id: string,
    result: {
      ok: boolean;
      orderId?: string;
      order?: any;
      error?: string;
    },
  ): Promise<void>;
  syncFromSupplier(
    subdomain: string,
    entityId: string,
    order: any,
    status?: string,
  ): Promise<void>;
}

export const loadOrderClass = (models: IModels) => {
  class Order {
    public static async logForward(doc: IOrder) {
      return models.Order.create({
        ...doc,
        status: ORDER_STATUS.PENDING,
      });
    }

    public static async markResult(
      _id: string,
      result: {
        ok: boolean;
        orderId?: string;
        order?: any;
        error?: string;
      },
    ) {
      await models.Order.updateOne(
        { _id },
        {
          $set: result.ok
            ? {
                status: ORDER_STATUS.FORWARDED,
                entityId: result.orderId ?? null,
                ...(result.order ? { order: result.order } : {}),
                error: null,
              }
            : {
                status: ORDER_STATUS.FAILED,
                error: result.error ?? 'forward failed',
              },
        },
      );
    }

    public static async syncFromSupplier(
      subdomain: string,
      entityId: string,
      order: any,
      status?: string,
    ) {
      await models.Order.updateOne(
        { subdomain, entityId },
        {
          $set: {
            order,
            ...(status ? { status } : {}),
            error: null,
          },
        },
      );
    }
  }

  orderSchema.loadClass(Order);

  return orderSchema;
};
