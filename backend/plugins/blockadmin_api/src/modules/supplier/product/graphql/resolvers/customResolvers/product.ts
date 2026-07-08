import { IContext } from '~/connectionResolvers';
import { IBaProductBlockDocument } from '@/supplier/product/@types/product';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { resolveAttachmentUrl } from '@/supplier/utils/fileUrl';

export const BaProduct = {
  attachment: ({ attachment, subdomain }: IBaProductBlockDocument) =>
    resolveAttachmentUrl(attachment, subdomain),

  attachmentMore: ({ attachmentMore, subdomain }: IBaProductBlockDocument) =>
    Array.isArray(attachmentMore)
      ? attachmentMore.map((a) => resolveAttachmentUrl(a, subdomain))
      : attachmentMore,

  supplier: async (
    product: IBaProductBlockDocument,
    _args: any,
    { models }: IContext,
  ) => {
    return models.Supplier.findOne({
      subdomain: product.subdomain,
    }).lean();
  },

  category: async (
    product: IBaProductBlockDocument,
    _args: any,
    { subdomain }: IContext,
  ) => {
    if (!product.categoryId && !product.initialCategory) {
      return null;
    }

    if (product.initialCategory && !product.categoryId) {
      return product.initialCategory;
    }

    return sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'productCategories',
      action: 'findOne',
      input: { query: { _id: product.categoryId } },
      defaultValue: null,
    });
  },
};
