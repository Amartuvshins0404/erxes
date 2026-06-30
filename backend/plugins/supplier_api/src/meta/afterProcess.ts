import {
  AfterProcessConfigs,
  IAfterProcessRule,
  sendTRPCMessage,
} from 'erxes-api-shared/utils';
import { sendMessage } from '~/modules/admin/utils';
import {
  buildCategorySnapshot,
  buildProductSyncPayload,
  getPosCategoryIds,
  getSupplierPosToken,
} from '~/modules/admin/productSync';

const productCreateOrUpdateMutations = ['productsAdd', 'productsEdit'];
const productCategoryCreateOrUpdateMutations = [
  'productCategoriesAdd',
  'productCategoriesEdit',
];

const mutationNames = [
  ...productCreateOrUpdateMutations,
  'productsRemove',
  ...productCategoryCreateOrUpdateMutations,
  'productCategoriesRemove',
];

const allRules: IAfterProcessRule[] = [
  {
    type: 'afterMutation',
    mutationNames,
  },
];

// Whether a category is part of the POS the supplier exposes to mushop.
const isInSelectedPos = async (
  subdomain: string,
  categoryId?: string,
): Promise<boolean> => {
  if (!categoryId) return false;

  const posToken = await getSupplierPosToken(subdomain);
  if (!posToken) return false;

  const categoryIds = await getPosCategoryIds(subdomain, posToken);
  return categoryIds.includes(categoryId);
};

export const afterProcess: AfterProcessConfigs = {
  rules: allRules,
  afterMutation: async (ctx, input) => {
    const { mutationName, args, result } = input?.data ?? {};

    if (!mutationNames.includes(mutationName)) {
      return;
    }

    if (mutationName === 'productsRemove') {
      const productIds: string[] = args?.productIds || [];

      sendMessage({
        subdomain: ctx.subdomain,
        path: 'syncProduct',
        payload: {
          entityIds: productIds,
          data: { action: 'delete' },
        },
      });

      return;
    }

    if (mutationName === 'productCategoriesRemove') {
      const categoryId: string | undefined = args?._id;

      if (!categoryId) return;

      sendMessage({
        subdomain: ctx.subdomain,
        path: 'syncProductCategory',
        payload: {
          entityId: categoryId,
          data: { action: 'delete' },
        },
      });

      return;
    }

    if (productCategoryCreateOrUpdateMutations.includes(mutationName)) {
      const category = result;

      if (!category?._id) return;

      // supplier-valid: only forward categories inside the POS the supplier
      // exposes to mushop.
      if (!(await isInSelectedPos(ctx.subdomain, category._id))) return;

      sendMessage({
        subdomain: ctx.subdomain,
        path: 'syncProductCategory',
        payload: {
          entityId: category._id,
          data: {
            category: buildCategorySnapshot(category),
            action: mutationName === 'productCategoriesAdd' ? 'create' : 'update',
          },
        },
      });

      return;
    }

    // productsAdd | productsEdit
    const product = result;

    if (!product?._id) return;

    // supplier-valid: only forward products inside the POS the supplier exposes
    // to mushop.
    if (!(await isInSelectedPos(ctx.subdomain, product.categoryId))) return;

    let category: any = null;

    if (product.categoryId) {
      try {
        category = await sendTRPCMessage({
          subdomain: ctx.subdomain,
          pluginName: 'core',
          module: 'productCategories',
          action: 'findOne',
          input: { query: { _id: product.categoryId } },
          defaultValue: null,
        });
      } catch (e) {
        console.error('Failed to fetch product category:', e);
      }
    }

    sendMessage({
      subdomain: ctx.subdomain,
      path: 'syncProduct',
      payload: buildProductSyncPayload(
        product,
        category,
        mutationName === 'productsAdd' ? 'create' : 'update',
      ),
    });
  },
};
