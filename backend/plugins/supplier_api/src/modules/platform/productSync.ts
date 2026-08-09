import { getEnv, sendTRPCMessage } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { sendMessage } from '~/modules/platform/shared';

const NODE_ENV = getEnv({ name: 'NODE_ENV', defaultValue: 'development' });

const BACKFILL_CHUNK_SIZE = 50;

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

const toAttachmentUrl = (attachment: any, subdomain: string) => {
  if (!attachment || typeof attachment.url !== 'string') {
    return attachment;
  }

  if (attachment.url.includes('http')) {
    return attachment;
  }

  const domain =
    NODE_ENV === 'development'
      ? 'http://localhost:4000'
      : getEnv({
          name: 'DOMAIN',
          subdomain,
          defaultValue: 'http://localhost:4000',
        }).replace('<subdomain>', subdomain);

  return { ...attachment, url: `${domain}/read-file?key=${attachment.url}` };
};

const normalizeAttachments = (product: any, subdomain: string) => ({
  attachment: toAttachmentUrl(product.attachment, subdomain),
  attachmentMore: Array.isArray(product.attachmentMore)
    ? product.attachmentMore.map((a: any) => toAttachmentUrl(a, subdomain))
    : product.attachmentMore,
  pdfAttachment: toAttachmentUrl(product.pdfAttachment, subdomain),
});

export const buildProductSyncPayload = (
  product: any,
  category: any,
  action: 'create' | 'update',
  subdomain: string,
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
      ...normalizeAttachments(product, subdomain),
      scopeBrandIds: product.scopeBrandIds,
      uom: product.uom,
      subUoms: product.subUoms,
      currency: product.currency,
    },
    action,
  },
});

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

export const backfillPosCatalog = async (
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

    const categoryIds = Array.from(
      new Set(
        products
          .map((p) => p.categoryId)
          .filter((id): id is string => !!id),
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

    await processInChunks(
      Array.from(categoryById.values()),
      BACKFILL_CHUNK_SIZE,
      (category) =>
        sendMessage({
          subdomain,
          path: 'syncProductCategory',
          payload: {
            entityId: category._id,
            data: {
              category: buildCategorySnapshot(category),
              action: 'create',
            },
          },
        }),
    );

    await processInChunks(products, BACKFILL_CHUNK_SIZE, (product) =>
      sendMessage({
        subdomain,
        path: 'syncProduct',
        payload: buildProductSyncPayload(
          product,
          categoryById.get(product.categoryId) ?? null,
          'create',
          subdomain,
        ),
      }),
    );
  } catch (e) {
    console.error('backfillPosCatalog error:', e);
  }
};

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
