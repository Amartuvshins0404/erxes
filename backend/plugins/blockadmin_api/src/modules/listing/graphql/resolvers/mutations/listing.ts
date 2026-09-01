import { IContext } from '~/connectionResolvers';
import { sendBlockAgencyMessage } from '~/modules/blockagency/utils';

export interface ListingStatusInput {
  status?: string;
  isFeatured?: boolean;
}

export const listingMutations = {
  blockAdminRemoveAgencyListing: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const listing = await models.Listing.findById(_id).lean();
    if (!listing) throw new Error('Listing not found');

    const { subdomain, entityId } = listing;

    try {
      const response = await sendBlockAgencyMessage({
        subdomain,
        path: 'removeListing',
        payload: { data: {}, entityId },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove listing: ${response.statusText}`);
      }

      await models.Listing.deleteOne({ _id });

      return listing;
    } catch (error) {
      throw new Error(`Failed to remove listing: ${error}`);
    }
  },

  blockAdminUpdateAgencyListingStatus: async (
    _root: undefined,
    { _id, input }: { _id: string; input: ListingStatusInput },
    { models }: IContext,
  ) => {
    const listing = await models.Listing.findById(_id);

    if (!listing) {
      throw new Error('Listing not found');
    }

    const { subdomain, entityId } = listing;

    try {
      const response = await sendBlockAgencyMessage({
        subdomain,
        path: 'updateListingStatus',
        payload: { data: { input }, entityId },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update listing status: ${response.statusText}`,
        );
      }

      const updatedListing = await models.Listing.findByIdAndUpdate(
        _id,
        { $set: input },
        { new: true },
      );

      return updatedListing;
    } catch (error) {
      throw new Error(`Failed to update listing status: ${error}`);
    }
  },
};
