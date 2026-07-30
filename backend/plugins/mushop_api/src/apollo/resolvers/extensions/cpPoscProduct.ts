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

  moq: async (
    product: { _id: string },
    _args: undefined,
    { models }: IContext,
  ) => {
    const spec = await resolveSpec(product._id, models);
    return spec?.moq ?? null;
  },

  prePaymentAmount: async (
    product: { _id: string },
    _args: undefined,
    { models }: IContext,
  ) => {
    const [spec, mushopProduct] = await Promise.all([
      resolveSpec(product._id, models),
      models.Product.findOne({ _id: product._id }).lean(),
    ]);

    const percent = spec?.prepaymentPercent;
    const unitPrice = mushopProduct?.unitPrice;

    if (unitPrice == null || percent == null) return null;

    return (unitPrice * percent) / 100;
  },
};

const resolveSpec = (productId: string, models: IContext['models']) =>
  models.ProductSpecification.findOne({ productId }).lean();
