import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { IBaProduct } from '@/supplier/product/@types/product';

const router: Router = Router();

router.post(
  '/syncProduct',
  async (
    req: IRequest<IBaProduct, { product?: IBaProduct; action?: string }>,
    res: IResponse,
  ) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};
      const { entityId, entityIds, data } = (payload || {}) as {
        entityId?: string;
        entityIds?: string[];
        data?: { product?: any; action?: string };
      };
      const { product, action } = data || {};

      if (!subdomain) {
        return res.status(400).json({ error: 'subdomain is required' });
      }

      if (action === 'delete') {
        const ids = entityIds?.length
          ? entityIds
          : entityId
            ? [entityId]
            : [];

        if (!ids.length) {
          return res
            .status(400)
            .json({ error: 'entityId or entityIds required for delete' });
        }

        await models.SupplierProduct.softDeleteByEntityIds(subdomain, ids);

        return res.status(200).json({ success: true });
      }

      if (!entityId) {
        return res.status(400).json({ error: 'payload.entityId is required' });
      }

      const { category, ...productRest } = product || {};

      await models.SupplierProduct.syncProduct(
        subdomain,
        entityId,
        { ...productRest, initialCategory: category ?? null },
        action === 'create' ? 'create' : 'update',
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  '/syncProductCategory',
  async (req: IRequest<any>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};
      const { entityId, data } = (payload || {}) as {
        entityId?: string;
        data?: { category?: any; action?: string };
      };
      const { category, action = 'update' } = data || {};

      if (!subdomain) {
        return res.status(400).json({ error: 'subdomain is required' });
      }
      if (!entityId) {
        return res.status(400).json({ error: 'payload.entityId is required' });
      }

      if (action === 'delete') {
        await models.SupplierProduct.updateMany(
          { subdomain, 'initialCategory._id': entityId },
          { $set: { initialCategory: null } },
        );

        return res.status(200).json({ success: true });
      }

      if (!category?._id) {
        return res
          .status(400)
          .json({ error: 'payload.data.category is required' });
      }

      await models.SupplierProduct.updateMany(
        { subdomain, 'initialCategory._id': category._id },
        { $set: { initialCategory: category } },
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export { router };
