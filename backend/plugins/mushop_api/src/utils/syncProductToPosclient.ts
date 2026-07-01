import { sendTRPCMessage } from 'erxes-api-shared/utils';

const getPosInitialCategoryIds = async (
  subdomain: string,
  posToken: string,
): Promise<string[]> => {
  try {
    const config = await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'posclient',
      action: 'getConfigByToken',
      input: { token: posToken },
      defaultValue: null,
    });

    if (!config?.initialCategoryIds?.length) {
      return [];
    }

    const categories = await sendTRPCMessage({
      subdomain,

      pluginName: 'core',
      module: 'productCategories',
      action: 'withChilds',
      input: { ids: config?.initialCategoryIds ?? [] },
      defaultValue: [],
    });

    const categoryIds: string[] = (categories || []).map((ch) => ch._id) || [];

    return Array.from(new Set(categoryIds));
  } catch {
    return [];
  }
};

const crudData = async (
  subdomain: string,
  posToken: string,
  input: Record<string, any>,
): Promise<void> => {
  await sendTRPCMessage({
    subdomain,
    pluginName: 'posclient',
    method: 'mutation',
    module: 'posclient',
    action: 'crudData',
    input: { token: posToken, ...input },
    defaultValue: {},
  });
};

export const syncProductToPosclient = async ({
  subdomain,
  posToken,
  product,
  action = 'create',
}: {
  subdomain: string;
  posToken?: string;
  product: Record<string, any>;
  action?: 'create' | 'update';
}): Promise<void> => {
  if (!posToken) return;

  const categoryIds = await getPosInitialCategoryIds(subdomain, posToken);

  if (!categoryIds.includes(product.categoryId)) {
    await removeProductFromPosclient({
      subdomain,
      posToken,
      productId: product._id,
    });
    return;
  }

  try {
    await crudData(subdomain, posToken, {
      type: 'product',
      action,
      object: { ...product, status: "active"},
      updatedDocument: product,
    });
  } catch (e) {
    console.error('syncProductToPosclient error:', e);
  }
};

export const removeProductFromPosclient = async ({
  subdomain,
  posToken,
  productId,
}: {
  subdomain: string;
  posToken?: string;
  productId: string;
}): Promise<void> => {
  if (!posToken) return;

  try {
    await crudData(subdomain, posToken, {
      type: 'productsRemove',
      productIds: [productId],
    });
  } catch (e) {
    console.error('removeProductFromPosclient error:', e);
  }
};

export const syncCategoryToPosclient = async ({
  subdomain,
  posToken,
  category,
  action = 'update',
}: {
  subdomain: string;
  posToken?: string;
  category: Record<string, any>;
  action?: 'create' | 'update';
}): Promise<void> => {
  if (!posToken || !category?._id) return;

  const categoryIds = await getPosInitialCategoryIds(subdomain, posToken);

  if (!categoryIds.includes(category._id)) return;

  try {
    await crudData(subdomain, posToken, {
      type: 'productCategory',
      action,
      object: category,
      updatedDocument: category,
    });
  } catch (e) {
    console.error('syncCategoryToPosclient error:', e);
  }
};

export const removeCategoryFromPosclient = async ({
  subdomain,
  posToken,
  categoryId,
}: {
  subdomain: string;
  posToken?: string;
  categoryId: string;
}): Promise<void> => {
  if (!posToken || !categoryId) return;

  try {
    await crudData(subdomain, posToken, {
      type: 'productCategory',
      action: 'delete',
      object: { _id: categoryId },
    });
  } catch (e) {
    console.error('removeCategoryFromPosclient error:', e);
  }
};
