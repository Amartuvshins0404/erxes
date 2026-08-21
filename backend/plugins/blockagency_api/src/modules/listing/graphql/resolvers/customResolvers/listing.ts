import { IContext } from '~/connectionResolvers';
import { resolveListingAgent } from '~/modules/listing/utils';

export const BlockListing = {
  agent: async (
    listing: { memberId?: string },
    _args: unknown,
    { models, subdomain }: IContext,
  ) => {
    return resolveListingAgent(listing.memberId, subdomain, models);
  },
};
