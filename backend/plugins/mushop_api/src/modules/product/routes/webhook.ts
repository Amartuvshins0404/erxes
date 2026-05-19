import { Router, Request, Response } from 'express';
import { generateModels } from '~/connectionResolvers';

const router: Router = Router();

router.post('/syncProduct', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { entityId, entityIds, data } = payload || {};
    const { product, action } = data || {};

    console.log('{subdomain, entityId}', {subdomain, entityId})

    if (!subdomain) return res.status(400).json({ error: 'subdomain is required' });
    if (!entityId) return res.status(400).json({ error: 'payload.entityId is required' });

    const models = await generateModels(subdomain);

    console.log('action', action)

    if (entityIds?.length && action === 'delete') {
      await models.MushopProduct.deleteMany({ subdomain, entityId: { $in: entityIds } });
      return res.status(200).json({ success: true });
    }

    console.log('product', product)

    await models.MushopProduct.syncProduct(
      subdomain,
      entityId,
      product,
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

    if (!subdomain) return res.status(400).json({ error: 'subdomain is required' });
    if (!entityId) return res.status(400).json({ error: 'payload.entityId is required' });

    const models = await generateModels(subdomain);

    await models.MushopProduct.findOneAndUpdate(
      { subdomain, 'initialCategory._id': category._id },
      { $set: { initialCategory: category ?? null } },
    );

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export { router };
