import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

export const cpPoscProduct = {
  supplier: async (
    product: { _id: string },
    _args: undefined,
    { models }: IContext,
  ) => {
    const mushopProduct = await models.Product.findOne({
      _id: product._id,
    }).lean();

    if (!mushopProduct?.subdomain) return null;

    return models.Supplier.findOne({
      subdomain: mushopProduct.subdomain,
    }).lean();
  },

  terms: async (
    { _id }: { _id: string },
    _args: undefined,
    { models, subdomain }: IContext,
  ) => {
    const terms: Record<string, unknown> = {}

    let product = await models.Product.findOne({ _id }).lean();

    if (!product) {
      product = await sendTRPCMessage({
        subdomain,
        pluginName: "core",
        method: "query",
        module: "products",
        action: "findOne",
        input: {
          query: { _id },
        },
        defaultValue: {},
      })
    };

    if (!product?._id || !product?.unitPrice) return terms;

    const term = await models.ProductSpecification.findOne({ productId: product._id }).lean();

    if (!term) return terms;

    terms.moq = term.moq || 1;
    
    if (term.prepaymentPercent) {
      const prePaymentAmount = (product.unitPrice * term.prepaymentPercent) / 100;

      terms.prePaymentPercent = term.prepaymentPercent;
      terms.prePaymentAmount = prePaymentAmount;
    }

    if (product?.subdomain) {
      const [orders] = await models.Order.aggregate([
        {
          $unwind: "$order.items"
        },
        {
          $match: {
            "subdomain": product.subdomain,
            "order.items.productId": product._id,
            "status": { $in: ["forwarded", "failed"] }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            quantity: { $sum: "$order.items.quantity" }
          }
        },
        {
          $project: {
            _id: 0,
            count: 1,
            quantity: 1
          }
        }
      ])

      if (Object.keys(orders || {}).length > 0) {
        terms.orderCount = orders.count;
        terms.orderQuantity = orders.quantity;
      }

      return terms;
    }

    const [orders] = await models.Order.aggregate([
      {
        $lookup: {
          from: "pos_orders",
          let: {
            productId: product._id
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$$productId",
                    "$items.productId"
                  ]
                }
              }
            }
          ],
          as: "orders"
        }
      },
      {
        $unwind: "$orders"
      },
      {
        $unwind: "$orders.items"
      },
      {
        $match: {
          "orders.items.productId": product._id,
          status: {
            $in: ["forwarded", "failed"]
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          quantity: { $sum: "$order.items.quantity" }
        }
      },
      {
        $project: {
          _id: 0,
          count: 1,
          quantity: 1
        }
      }
    ])

    if (Object.keys(orders || {}).length > 0) {
      terms.orderCount = orders.count;
      terms.orderQuantity = orders.quantity;
    }

    return terms
  },
};
