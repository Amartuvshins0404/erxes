import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { notifyBlockCustomer } from '~/utils/cpNotify';
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

  // Whether block-admin has ever seen this contract before must be checked
  // BEFORE the upsert, so the "you have a new contract" notification fires
  // exactly once, on the sync that first creates the record here.
  const existing = await models.Contract.findOne({ subdomain, entityId });

  const contract = await models.Contract.upsertSignedContract(
    subdomain,
    entityId,
    { ...input, unit: unit._id },
  );

  if (!existing && contract?.customerId) {
    await notifyBlockCustomer(models, subdomain, contract.customerId, {
      title: 'Шинэ гэрээ',
      message: `Танд ${
        contract.number ? `"${contract.number}" дугаартай ` : ''
      }үл хөдлөх хөрөнгийн гэрээ үүслээ.`,
      type: 'success',
      contentType: 'blockadmin:contract',
      contentTypeId: contract._id,
    });
  }

  return contract;
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
