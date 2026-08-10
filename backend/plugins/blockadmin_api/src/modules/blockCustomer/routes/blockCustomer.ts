import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { ICustomerSyncData, resolveBlockCustomer } from '../utils';

const router: Router = Router();

router.post(
  '/customerSync',
  async (req: IRequest<{}, ICustomerSyncData>, res: IResponse) => {
    console.log('customerSync', req.body);
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const customer = await resolveBlockCustomer(
        subdomain,
        entityId,
        data,
        models,
      );

      return res.status(200).json({
        success: true,
        blockAdminId: customer.customerId,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

export { router };
