import { Router, Request, Response } from 'express';
import { generateModels } from '~/connectionResolvers';

const router: Router = Router();

router.post('/collective-package/create', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { data } = payload || {};
    const { targetSubdomain, ...doc } = data || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!targetSubdomain) {
      return res.status(400).json({ error: 'targetSubdomain is required' });
    }

    const models = await generateModels(subdomain);

    const pkg = await models.CollectivePackage.createCollectivePackage(
      targetSubdomain,
      doc,
    );

    return res.status(200).json({ success: true, package: pkg });
  } catch (e: any) {
    console.error('collective-package/create failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/collective-package/list', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { data } = payload || {};
    const { targetSubdomain, ...params } = data || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!targetSubdomain) {
      return res.status(400).json({ error: 'targetSubdomain is required' });
    }

    const models = await generateModels(subdomain);

    const collective = await models.Collective.findOne({ targetSubdomain })
      .lean();

    if (!collective) {
      return res
        .status(200)
        .json({ list: [], pageInfo: null, totalCount: 0 });
    }

    const result = await models.CollectivePackage.listCollectivePackages({
      ...params,
      collectiveId: collective._id,
    });

    return res.status(200).json(result);
  } catch (e: any) {
    console.error('collective-package/list failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post(
  '/collective-package/edit',
  async (req: Request, res: Response) => {
    try {
      const { subdomain, payload } = req.body || {};
      const { data } = payload || {};
      const { targetSubdomain, _id, patch } = data || {};

      if (!subdomain) {
        return res.status(400).json({ error: 'subdomain is required' });
      }

      if (!targetSubdomain) {
        return res.status(400).json({ error: 'targetSubdomain is required' });
      }

      if (!_id) {
        return res.status(400).json({ error: '_id is required' });
      }

      if (!patch || typeof patch !== 'object') {
        return res.status(400).json({ error: 'patch is required' });
      }

      const models = await generateModels(subdomain);

      const pkg = await models.CollectivePackage.editPackage(
        targetSubdomain,
        _id,
        patch,
      );

      return res.status(200).json({ success: true, package: pkg });
    } catch (e: any) {
      console.error('collective-package/edit failed:', e);
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post(
  '/collective-package/update-status',
  async (req: Request, res: Response) => {
    try {
      const { subdomain, payload } = req.body || {};
      const { data } = payload || {};
      const { targetSubdomain, _id, status } = data || {};

      if (!subdomain) {
        return res.status(400).json({ error: 'subdomain is required' });
      }

      if (!targetSubdomain) {
        return res.status(400).json({ error: 'targetSubdomain is required' });
      }

      if (!_id) {
        return res.status(400).json({ error: '_id is required' });
      }

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      const models = await generateModels(subdomain);

      const pkg = await models.CollectivePackage.updatePackageStatus(
        targetSubdomain,
        _id,
        status,
      );

      return res.status(200).json({ success: true, package: pkg });
    } catch (e: any) {
      console.error('collective-package/update-status failed:', e);
      return res.status(400).json({ error: e.message });
    }
  },
);

router.post('/collective-package/detail', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { data } = payload || {};
    const { targetSubdomain, _id } = data || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!targetSubdomain) {
      return res.status(400).json({ error: 'targetSubdomain is required' });
    }

    if (!_id) {
      return res.status(400).json({ error: '_id is required' });
    }

    const models = await generateModels(subdomain);

    const pkg = await models.CollectivePackage.findOne({ _id }).lean();

    if (!pkg) {
      return res.status(404).json({ error: 'Collective package not found' });
    }

    const collective = await models.Collective.findOne({
      _id: pkg.collectiveId,
    }).lean();

    if (!collective || collective.targetSubdomain !== targetSubdomain) {
      return res
        .status(403)
        .json({ error: 'Package does not belong to this collective' });
    }

    return res.status(200).json({ package: pkg });
  } catch (e: any) {
    console.error('collective-package/detail failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

export { router };
