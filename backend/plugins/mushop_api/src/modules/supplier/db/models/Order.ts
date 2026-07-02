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
      customerId?: string;
      error?: string;
    },
  ): Promise<void>;
}

export const loadOrderClass = (models: IModels) => {
  class Order {
    // Recorded right before mushop hands the order to the supplier server.
    public static async logForward(doc: IOrder) {
      return models.Order.create({
        ...doc,
        status: ORDER_STATUS.PENDING,
      });
    }

    // Closes out the record once the supplier server responds.
    public static async markResult(
      _id: string,
      result: {
        ok: boolean;
        orderId?: string;
        customerId?: string;
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
                customerId: result.customerId ?? null,
                error: null,
              }
            : {
                status: ORDER_STATUS.FAILED,
                error: result.error ?? 'forward failed',
              },
        },
      );
    }
  }

  orderSchema.loadClass(Order);

  return orderSchema;
};
