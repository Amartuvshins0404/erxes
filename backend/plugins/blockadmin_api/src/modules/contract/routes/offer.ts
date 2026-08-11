import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { notifyBlockCustomer } from '~/utils/cpNotify';
import { IOffer, OfferStatus } from '../@types/offer';

const router: Router = Router();

// Only sent offers are mirrored into block-admin.
const syncIfSent = async (
  models: IContext['models'],
  subdomain: string,
  entityId: string,
  input: IOffer,
) => {
  if (input.status !== OfferStatus.SENT) {
    return null;
  }

  const unit = await models.Unit.getUnit(subdomain, input.unit);

  if (!unit) {
    throw new Error(`Unit "${input.unit}" not found in subdomain "${subdomain}"`);
  }

  // Whether block-admin has ever seen this offer before must be checked
  // BEFORE the upsert, so the "you have a new offer" notification fires
  // exactly once, on the sync that first creates the record here.
  const existing = await models.Offer.findOne({ subdomain, entityId });

  const offer = await models.Offer.upsertSentOffer(subdomain, entityId, {
    ...input,
    unit: unit._id,
  });

  if (!existing && offer?.customerId) {
    await notifyBlockCustomer(models, subdomain, offer.customerId, {
      title: 'Үнийн санал',
      message: 'Танд үнийн санал ирлээ.',
      type: 'success',
      contentType: 'blockadmin:offer',
      contentTypeId: offer._id,
    });
  }

  return offer;
};

router.post(
  '/blockCreateOffer',
  async (req: IRequest<IOffer>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      await syncIfSent(models, subdomain, entityId, input);

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
  '/blockUpdateOffer',
  async (req: IRequest<IOffer>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      await syncIfSent(models, subdomain, entityId, input);

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
  '/blockSendOfferEmail',
  async (req: IRequest<IOffer>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      if (!input) {
        return res.status(200).json({ success: true });
      }

      await syncIfSent(models, subdomain, entityId, input);

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
