import { checkLogin } from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { IBlockListing } from '~/modules/listing/@types/listing';
import { resolveListingAgent } from '~/modules/listing/utils';

export const blockListingMutations = {
  blockCreateListing: async (
    _root: undefined,
    { input }: { input: IBlockListing },
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);

    const listing = await models.BlockListing.createListing(input);

    input.agent = await resolveListingAgent(input.memberId, subdomain, models);

    return listing;
  },

  blockUpdateListingGeneralInfo: async (
    _root: undefined,
    { _id, input }: { _id: string; input: IBlockListing },
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);

    const listing = await models.BlockListing.updateListing({ _id, input });

    input.agent = await resolveListingAgent(input.memberId, subdomain, models);

    return listing;
  },

  blockRemoveListing: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    const listing = await models.BlockListing.findById(_id);

    if (!listing) {
      throw new Error('Listing not found');
    }

    await models.BlockListing.removeListing(_id);

    return listing;
  },
};
