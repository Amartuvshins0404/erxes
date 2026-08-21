import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { IBlockAdminListing } from '../@types/listing';

const router: Router = Router();

/**
 * Listing as `blockagency_api` sends it: agency-side listings carry the owning
 * member as `memberId`, which block admin stores as `agencyMemberId` because
 * agents are keyed by their agency-side id here too.
 */
type ISyncedListing = Omit<IBlockAdminListing, 'subdomain' | 'entityId'> & {
  memberId?: string;
};

const toListingInput = ({ memberId, ...listing }: ISyncedListing) =>
  memberId ? { ...listing, agencyMemberId: memberId } : listing;

router.post(
  '/blockCreateListing',
  async (req: IRequest<ISyncedListing>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const input = toListingInput(data.input);

      const listing = await models.Listing.findOne({ subdomain, entityId });

      if (!listing) {
        models.Listing.createListing({ ...input, subdomain, entityId });
      } else {
        models.Listing.updateListing(subdomain, entityId, input);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  '/blockUpdateListingGeneralInfo',
  async (req: IRequest<ISyncedListing>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      models.Listing.updateListing(
        subdomain,
        entityId,
        toListingInput(data.input),
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  '/blockRemoveListing',
  async (req: IRequest<ISyncedListing>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId } = payload || {};

      models.Listing.removeListing(subdomain, entityId);

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export { router };
