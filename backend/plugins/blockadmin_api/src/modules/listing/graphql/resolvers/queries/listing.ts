import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { IContext, IModels } from '~/connectionResolvers';
import { IBlockAdminListingDocument } from '@/listing/@types/listing';
import {
  buildListingStats,
  EMPTY_LISTING_STATS,
  generateFilter,
} from '@/listing/utils';
import { resolveAgentKeys } from '@/member/utils';
import { EMPTY_CURSOR_LIST } from '~/utils';
import { FilterQuery } from 'mongoose';

export interface ListingQueryParams {
  subdomain?: string;
  status?: string;
  searchValue?: string;
  city?: string;
  district?: string;
  /** Block admin `BlockAdminAgent._id` of the owning agent. */
  agencyMemberId?: string;
}

/**
 * Listings store the agency-side member id, so a block admin agent `_id` is
 * translated first. Returns `null` when the agent is unknown, which callers
 * must treat as "no listings" rather than as "no filter".
 */
const buildListingFilter = async (
  models: IModels,
  { agencyMemberId, ...params }: ListingQueryParams,
): Promise<FilterQuery<IBlockAdminListingDocument> | null> => {
  if (!agencyMemberId) {
    return generateFilter(params);
  }

  const keys = await resolveAgentKeys(models, agencyMemberId);

  if (!keys) {
    return null;
  }

  return generateFilter({
    ...params,
    subdomain: params.subdomain || keys.subdomain,
    agencyMemberId: keys.entityId,
  });
};

export const listingQueries = {
  getBlockAdminListing: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const listing = await models.Listing.findById(_id).lean();
    if (!listing) throw new Error('Listing not found');
    return listing;
  },

  getBlockAdminListings: async (
    _root: undefined,
    params: ListingQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    const filter = await buildListingFilter(models, params);

    if (!filter) {
      return EMPTY_CURSOR_LIST;
    }

    const { list, pageInfo, totalCount } =
      await cursorPaginate<IBlockAdminListingDocument>({
        model: models.Listing,
        params,
        query: filter,
      });

    return { list, pageInfo, totalCount };
  },

  getBlockAdminListingStats: async (
    _root: undefined,
    { subdomain, agencyMemberId }: ListingQueryParams,
    { models }: IContext,
  ) => {
    const filter = await buildListingFilter(models, {
      subdomain,
      agencyMemberId,
    });

    if (!filter) {
      return EMPTY_LISTING_STATS;
    }

    return await buildListingStats(models.Listing, filter);
  },
};
