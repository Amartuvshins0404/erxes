import { Router, Request, Response } from 'express';
import { generateModels } from '~/connectionResolvers';

const router: Router = Router();

const syncSupplierRecord = async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { entityId, data } = payload || {};
    const { input, userId } = data || {};

    if (!subdomain)
      return res.status(400).json({ error: 'subdomain is required' });
    if (!entityId)
      return res.status(400).json({ error: 'payload.entityId is required' });

    const models = await generateModels(subdomain);

    await models.Supplier.syncFromSupplier(entityId, subdomain, input, userId);

    return res.status(200).json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

router.post('/updateSupplier', syncSupplierRecord);

export { router };
