import { Router, Request, Response } from 'express';
import { generateModels } from '~/connectionResolvers';
import {
  MUSHOP_PRODUCT_STATE,
  MUSHOP_PRODUCT_STATUS,
} from '@/product/db/definitions/product';
import {
  removeCategoryFromPosclient,
  removeProductFromPosclient,
  syncCategoryToPosclient,
  syncProductToPosclient,
} from '~/utils/syncProductToPosclient';

const router: Router = Router();

router.post('/syncProduct', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { entityId, entityIds, data } = payload || {};
    const { product, action } = data || {};

    if (!subdomain)
      return res.status(400).json({ error: 'subdomain is required' });

    const models = await generateModels(subdomain);

    const supplier = await models.Supplier.findOne({ subdomain }).lean();

    if (!supplier) {
      console.log('Supplier not found for subdomain', subdomain);

      return res.status(404).json({ error: 'Supplier not found' });
    }

    const posToken = supplier.mushopPosToken;

    if (action === 'delete') {
      const ids = entityIds?.length ? entityIds : entityId ? [entityId] : [];

      if (!ids.length) {
        return res
          .status(400)
          .json({ error: 'entityId or entityIds required for delete' });
      }

      const removed = await models.Product.softDeleteByEntityIds(subdomain, ids);

      await Promise.all(
        removed.map((p) =>
          removeProductFromPosclient({ subdomain, posToken, productId: p._id }),
        ),
      );

      return res.status(200).json({ success: true });
    }

    if (!entityId)
      return res.status(400).json({ error: 'payload.entityId is required' });

    const { category, ...productRest } = product || {};

    const synced = await models.Product.syncProduct(
      subdomain,
      entityId,
      { ...productRest, initialCategory: category ?? null },
      action,
    );

    if (
      synced?.status === MUSHOP_PRODUCT_STATUS.APPROVED &&
      synced?.state === MUSHOP_PRODUCT_STATE.ACTIVE
    ) {
      await syncProductToPosclient({
        subdomain,
        posToken,
        product: synced.toObject ? synced.toObject() : synced,
        action: action === 'create' ? 'create' : 'update',
      });
    }

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

router.post('/syncProductCategory', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { entityId, data } = payload || {};
    const { category, action = 'update' } = data || {};

    if (!subdomain)
      return res.status(400).json({ error: 'subdomain is required' });

    if (!entityId)
      return res.status(400).json({ error: 'payload.entityId is required' });

    const models = await generateModels(subdomain);

    const supplier = await models.Supplier.findOne({ subdomain }).lean();

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const posToken = supplier.mushopPosToken;

    if (action === 'delete') {
      await models.Product.updateMany(
        { subdomain, 'initialCategory._id': entityId },
        { $set: { initialCategory: null } },
      );

      await removeCategoryFromPosclient({
        subdomain,
        posToken,
        categoryId: entityId,
      });

      return res.status(200).json({ success: true });
    }

    if (!category?._id)
      return res.status(400).json({ error: 'payload.data.category is required' });

    await models.Product.updateMany(
      { subdomain, 'initialCategory._id': category._id },
      { $set: { initialCategory: category } },
    );

    await syncCategoryToPosclient({
      subdomain,
      posToken,
      category,
      action: action === 'create' ? 'create' : 'update',
    });

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export { router };
