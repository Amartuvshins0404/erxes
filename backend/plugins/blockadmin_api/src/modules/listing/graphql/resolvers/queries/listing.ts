import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { IContext, IModels } from '~/connectionResolvers';
import { IBlockAdminListingDocument } from '@/listing/@types/listing';
import {
  buildListingStats,
  EMPTY_LISTING_STATS,
  generateFilter,
} from '@/listing/utils';
import { resolveAgencyKeys, resolveAgentKeys } from '@/member/utils';
import { EMPTY_CURSOR_LIST } from '~/utils';
import { FilterQuery } from 'mongoose';

export interface ListingQueryParams {
  subdomain?: string;
  status?: string;
  searchValue?: string;
  city?: string;
  district?: string;
  /** Block admin `BlockAdminAgency._id` of the owning agency. */
  agencyId?: string;
  /** Block admin `BlockAdminAgent._id` of the owning agent. */
  agencyMemberId?: string;
}


const resolveListingScope = async (
  models: IModels,
  { agencyId, agencyMemberId }: ListingQueryParams,
): Promise<{ subdomain?: string; memberEntityId?: string } | null> => {
  const scope: { subdomain?: string; memberEntityId?: string } = {};

  if (agencyId) {
    const keys = await resolveAgencyKeys(models, agencyId);

    if (!keys) {
      return null;
    }

    scope.subdomain = keys.subdomain;
  }

  if (agencyMemberId) {
    const keys = await resolveAgentKeys(models, agencyMemberId);

    if (!keys || (scope.subdomain && scope.subdomain !== keys.subdomain)) {
      return null;
    }

    scope.subdomain = keys.subdomain;
    scope.memberEntityId = keys.entityId;
  }

  return scope;
};

const buildListingFilter = async (
  models: IModels,
  { agencyId, agencyMemberId, ...params }: ListingQueryParams,
): Promise<FilterQuery<IBlockAdminListingDocument> | null> => {
  if (!agencyId && !agencyMemberId) {
    return generateFilter(params);
  }

  const scope = await resolveListingScope(models, { agencyId, agencyMemberId });

  if (!scope) {
    return null;
  }

  return generateFilter({
    ...params,
    subdomain: params.subdomain || scope.subdomain,
    agencyMemberId: scope.memberEntityId,
  });
};

export const listingQueries = {
  getBlockAdminAgencyListing: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const listing = await models.Listing.findById(_id).lean();
    if (!listing) throw new Error('Listing not found');
    return listing;
  },

  getBlockAdminAgencyListings: async (
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

  getBlockAdminAgencyListingStats: async (
    _root: undefined,
    { subdomain, agencyId, agencyMemberId }: ListingQueryParams,
    { models }: IContext,
  ) => {
    const filter = await buildListingFilter(models, {
      subdomain,
      agencyId,
      agencyMemberId,
    });

    if (!filter) {
      return EMPTY_LISTING_STATS;
    }

    return await buildListingStats(models.Listing, filter);
  },
};
