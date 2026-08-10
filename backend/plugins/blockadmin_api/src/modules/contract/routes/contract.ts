import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { ContractStatus, IContract } from '../@types/contract';

const router: Router = Router();

// Only signed contracts are mirrored into block-admin.
const syncIfSigned = async (
  models: IContext['models'],
  subdomain: string,
  entityId: string,
  input: IContract,
) => {
  if (input.status !== ContractStatus.SIGNED) {
    return null;
  }

  const unit = await models.Unit.getUnit(subdomain, input.unit);

  if (!unit) {
    throw new Error(`Unit "${input.unit}" not found in subdomain "${subdomain}"`);
  }

  return models.Contract.upsertSignedContract(subdomain, entityId, {
    ...input,
    unit: unit._id,
  });
};

router.post(
  '/blockCreateContract',
  async (req: IRequest<IContract>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      await syncIfSigned(models, subdomain, entityId, input);

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

      await syncIfSigned(models, subdomain, entityId, input);

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
  '/blockUpdateContractStatus',
  async (req: IRequest<IContract>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      if (!input) {
        return res.status(200).json({ success: true });
      }

      await syncIfSigned(models, subdomain, entityId, input);

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
  async (req: IRequest<{}, { customerId?: string }>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { customerId } = data || ({} as any);

      // May race ahead of the blockCreateContract/blockUpdateContract sync
      // that first creates the record in block-admin — that sync already
      // stamps signedAt/customerId itself, so a missing record here is a
      // harmless no-op rather than an error.
      const existing = await models.Contract.findOne({ subdomain, entityId });

      if (existing) {
        await models.Contract.markContractSigned(subdomain, entityId, {
          customerId,
          signedAt: new Date(),
        });
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
