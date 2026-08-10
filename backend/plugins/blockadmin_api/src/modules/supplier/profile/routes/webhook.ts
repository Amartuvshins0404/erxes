import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { ISupplier } from '@/supplier/profile/@types/supplier';

const router: Router = Router();

router.post(
  '/updateSupplier',
  async (req: IRequest<ISupplier>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};
      const { entityId, data } = payload || {};
      const { input } = data || {};

      if (!subdomain) {
        return res.status(400).json({ error: 'subdomain is required' });
      }
      if (!entityId) {
        return res.status(400).json({ error: 'payload.entityId is required' });
      }

      const supplier = await models.Supplier.syncFromSupplier(
        entityId,
        subdomain,
        input,
      );

      return res.status(200).json({ success: true, code: supplier?.code });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export { router };
