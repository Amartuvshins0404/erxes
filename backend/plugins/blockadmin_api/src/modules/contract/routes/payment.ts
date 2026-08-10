import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { IContractPaymentSyncRow } from '../@types/payment';

const router: Router = Router();

router.post(
  '/blockSyncContractPayments',
  async (
    req: IRequest<{}, { payments: IContractPaymentSyncRow[] }>,
    res: IResponse,
  ) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { payments } = data || {};

      await models.ContractPayment.replaceForContract(
        subdomain,
        entityId,
        payments || [],
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

export { router };
