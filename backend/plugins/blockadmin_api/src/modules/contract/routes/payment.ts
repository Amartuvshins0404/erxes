import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { IContractPaymentSyncRow } from '../@types/payment';
import { notifyPayment, paymentLabel } from '../utils/paymentNotify';

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

      // Payments are bulk-replaced on every sync (no per-row diffing on the
      // sender's side), so "just became paid" has to be detected here by
      // comparing against the schedule as it stood right before this sync.
      const existing = await models.ContractPayment.find({
        subdomain,
        contractId: entityId,
      }).lean();
      const previousStatusByEntityId = new Map(
        existing.map((payment) => [String(payment.entityId), payment.status]),
      );

      const updated = await models.ContractPayment.replaceForContract(
        subdomain,
        entityId,
        payments || [],
      );

      for (const payment of updated) {
        const wasPaid =
          previousStatusByEntityId.get(String(payment.entityId)) === 'paid';

        if (!wasPaid && payment.status === 'paid') {
          await notifyPayment(models, payment, {
            title: 'Төлбөр',
            message: `Таны ${paymentLabel(payment)} төлбөр амжилттай хийгдлээ.`,
            type: 'success',
          });
        }
      }

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
