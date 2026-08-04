import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { IContract } from '../@types/contract';

const router: Router = Router();

router.post(
  '/blockCreateContract',
  async (req: IRequest<IContract>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      const unit = await models.Unit.getUnit(subdomain, input.unit);

      models.Contract.createContract({
        ...input,
        subdomain,
        entityId,
        unit: unit._id,
      });

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

router.post(
  '/blockUpdateContract',
  async (req: IRequest<IContract>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      const unit = await models.Unit.getUnit(subdomain, input.unit);

      models.Contract.updateContract(subdomain, entityId, {
        ...input,
        unit: unit._id,
      });

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

router.post(
  '/contractSigned',
  async (
    req: IRequest<{}, { customerId?: string }>,
    res: IResponse,
  ) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { customerId } = data || ({} as any);

      await models.Contract.markContractSigned(subdomain, entityId, {
        customerId,
        signedAt: new Date(),
      });

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
