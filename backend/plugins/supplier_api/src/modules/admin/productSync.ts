import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { sendMessage } from '~/modules/admin/utils';

// How many catalog items the backfill processes at once. Chunks run
// sequentially so a large catalog doesn't fire thousands of concurrent calls
// at posclient/core/mushop.
const BACKFILL_CHUNK_SIZE = 50;

// Run `handler` over `items` in sequential chunks of `size`; within a chunk the
// work runs in parallel.
const processInChunks = async <T>(
  items: T[],
  size: number,
  handler: (item: T) => Promise<unknown>,
): Promise<void> => {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    await Promise.all(chunk.map(handler));
  }
};

type CategorySnapshot = {
  _id: string;
  name?: string;
  code?: string;
  order?: string;
  parentId?: string;
} | null;

export const buildCategorySnapshot = (category: any): CategorySnapshot =>
  category
    ? {
        _id: category._id,
        name: category.name,
        code: category.code,
        order: category.order,
        parentId: category.parentId,
      }
    : null;

// The mushop-facing product payload. Single source of truth shared by the
// per-edit afterProcess hook and the backfill that runs when a supplier
// (re)selects the POS they expose to mushop.
export const buildProductSyncPayload = (
  product: any,
  category: any,
  action: 'create' | 'update',
) => ({
  entityId: product._id,
  data: {
    product: {
      vendorId: product.vendorId,
      name: product.name,
      shortName: product.shortName,
      code: product.code,
      type: product.type,
      description: product.description,
      barcodes: product.barcodes,
      variants: product.variants,
      barcodeDescription: product.barcodeDescription,
      unitPrice: product.unitPrice,
      categoryId: product.categoryId,
      category: buildCategorySnapshot(category),
      propertiesData: product.propertiesData,
      tagIds: product.tagIds,
      attachment: product.attachment,
      attachmentMore: product.attachmentMore,
      scopeBrandIds: product.scopeBrandIds,
      uom: product.uom,
      subUoms: product.subUoms,
      currency: product.currency,
      pdfAttachment: product.pdfAttachment,
    },
    action,
  },
});

// All category ids (with children) covered by a POS, resolved in-tenant.
export const getPosCategoryIds = async (
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

    if (!config?.initialCategoryIds?.length) return [];

    const categories = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'productCategories',
      action: 'withChilds',
      input: { ids: config.initialCategoryIds },
      defaultValue: [],
    });

    const ids: string[] = (categories || []).map((c: any) => c._id) || [];
    return Array.from(new Set(ids));
  } catch (e) {
    console.error('getPosCategoryIds error:', e);
    return [];
  }
};

// Push the current catalog of the supplier's selected POS to mushop. Runs in
// the background after a supplier (re)selects their POS, so an existing catalog
// shows up in mushop without any manual trigger. New edits then keep it in
// sync via afterProcess.
export const backfillPosToMushop = async (
  subdomain: string,
  posToken: string,
): Promise<void> => {
  if (!posToken) return;

  try {
    const products = (await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'products',
      action: 'findByToken',
      input: { token: posToken },
      defaultValue: [],
    })) as Record<string, any>[];

    if (!products?.length) return;

    const allowedCategoryIds = await getPosCategoryIds(subdomain, posToken);
    const allowed = new Set(allowedCategoryIds);

    // Resolve each category once.
    const categoryIds = Array.from(
      new Set(
        products
          .map((p) => p.categoryId)
          .filter((id): id is string => !!id && allowed.has(id)),
      ),
    );

    const categoryById = new Map<string, any>();

    await processInChunks(categoryIds, BACKFILL_CHUNK_SIZE, async (id) => {
      try {
        const category = await sendTRPCMessage({
          subdomain,
          pluginName: 'core',
          module: 'productCategories',
          action: 'findOne',
          input: { query: { _id: id } },
          defaultValue: null,
        });
        if (category) categoryById.set(id, category);
      } catch (e) {
        console.error('backfill category fetch error:', e);
      }
    });

    // Sync categories first so the snapshot exists, then products.
    await processInChunks(
      Array.from(categoryById.values()),
      BACKFILL_CHUNK_SIZE,
      (category) =>
        sendMessage({
          subdomain,
          path: 'syncProductCategory',
          platform: 'mushop',
          payload: {
            entityId: category._id,
            data: {
              category: buildCategorySnapshot(category),
              action: 'create',
            },
          },
        }),
    );

    const syncableProducts = products.filter(
      (p) => p.categoryId && allowed.has(p.categoryId),
    );

    await processInChunks(syncableProducts, BACKFILL_CHUNK_SIZE, (product) =>
      sendMessage({
        subdomain,
        path: 'syncProduct',
        platform: 'mushop',
        payload: buildProductSyncPayload(
          product,
          categoryById.get(product.categoryId) ?? null,
          'create',
        ),
      }),
    );
  } catch (e) {
    console.error('backfillPosToMushop error:', e);
  }
};

// Read the supplier's currently selected POS token (one supplier per tenant).
export const getSupplierPosToken = async (
  subdomain: string,
): Promise<string | undefined> => {
  try {
    const models = await generateModels(subdomain);
    const supplier = await models.Supplier.findOne().lean();
    return supplier?.posToken || undefined;
  } catch (e) {
    console.error('getSupplierPosToken error:', e);
    return undefined;
  }
};
