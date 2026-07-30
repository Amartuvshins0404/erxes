import { Router, Request, Response } from 'express';
import { generateModels } from '~/connectionResolvers';

const router: Router = Router();

router.post('/syncProduct', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { entityId, entityIds, data } = payload || {};
    const { product, action } = data || {};

    console.log('{subdomain, entityId}', {subdomain, entityId})

    if (!subdomain)
      return res.status(400).json({ error: 'subdomain is required' });

    const models = await generateModels(subdomain);

    const supplier = await models.Supplier.findOne({ subdomain }).lean();

    if (!supplier) {
      console.log('Supplier not found for subdomain', subdomain);

      return;
    }

    if (action === 'delete') {
      const ids = entityIds?.length ? entityIds : entityId ? [entityId] : [];

      if (!ids.length) {
        return res
          .status(400)
          .json({ error: 'entityId or entityIds required for delete' });
      }

      await models.Product.deleteMany({
        subdomain,
        entityId: { $in: ids },
      });
      return res.status(200).json({ success: true });
    }

    if (!entityId)
      return res.status(400).json({ error: 'payload.entityId is required' });

    const { category, ...productRest } = product || {};

    await models.Product.syncProduct(
      subdomain,
      entityId,
      { ...productRest, initialCategory: category ?? null },
      action,
    );

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

router.post('/syncProductCategory', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { entityId, data } = payload || {};
    const { category } = data || {};

    if (!subdomain)
      return res.status(400).json({ error: 'subdomain is required' });

    if (!entityId)
      return res.status(400).json({ error: 'payload.entityId is required' });

    const models = await generateModels(subdomain);

    await models.Product.findOneAndUpdate(
      { subdomain, 'initialCategory._id': category._id },
      { $set: { initialCategory: category ?? null } },
    );

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export { router };
