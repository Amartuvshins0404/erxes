import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { syncCustomerFromCore } from '../utils';

const router: Router = Router();

router.post(
  '/customerSync',
  async (req: IRequest<{}, {}>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId } = payload || {};

      const customer = await syncCustomerFromCore(subdomain, entityId, models);

      return res.status(200).json({
        success: true,
        blockAdminId: customer._id,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

export { router };
