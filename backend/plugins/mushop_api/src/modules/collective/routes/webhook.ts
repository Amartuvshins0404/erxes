import { Router, Request, Response } from 'express';
import { generateModels } from '~/connectionResolvers';

const router: Router = Router();

router.post('/updateCollective', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { data } = payload || {};
    const { input, userId } = data || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    const models = await generateModels(subdomain);

    const collective = await models.Collective.syncFromCollective(
      subdomain,
      input || {},
      userId,
    );

    return res.status(200).json({ success: true, collective });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

router.post('/collective/members', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { targetSubdomain } = payload?.data || payload || {};

    if (!subdomain)
      return res.status(400).json({ error: 'subdomain is required' });
    if (!targetSubdomain)
      return res
        .status(400)
        .json({ error: 'payload.targetSubdomain is required' });

    const models = await generateModels(subdomain);

    const collective = await models.Collective.findOne({
      targetSubdomain,
    }).lean();

    if (!collective) return res.status(200).json({ collective: null, suppliers: [] });

    const suppliers = await models.Supplier.find({
      _id: { $in: collective.supplierIds || [] },
    }).lean();

    return res.status(200).json({ collective, suppliers });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export { router };
