import { IBlockAdminListingDocument } from '@/listing/@types/listing';
import {
  buildListingStats,
  EMPTY_LISTING_STATS,
  generateFilter,
} from '@/listing/utils';
import { resolveAgencyKeys, resolveAgentKeys } from '@/member/utils';
import { IOffsetPaginateParams } from 'erxes-api-shared/core-types';
import { markResolvers, paginate } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';
import { IContext, IModels } from '~/connectionResolvers';


const PUBLIC_LISTING_STATUS = 'active';
const PUBLIC_LISTING_STATUSES = ['active', 'sold'];

export interface CpListingQueryParams {
  agencyId?: string;
  /** Block admin `CpBlockAdminAgent._id` of the owning agent. */
  agencyMemberId?: string;
  status?: string;
  type?: string;
  propertyType?: string;
  searchValue?: string;
  city?: string;
  district?: string;
}


const resolveScope = async (
  models: IModels,
  { agencyId, agencyMemberId }: CpListingQueryParams,
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

const buildPublicFilter = async (
  models: IModels,
  params: CpListingQueryParams,
): Promise<FilterQuery<IBlockAdminListingDocument> | null> => {
  const { status, type, propertyType, searchValue, city, district } = params;

  const scope = await resolveScope(models, params);

  if (!scope) {
    return null;
  }


  if (status && !PUBLIC_LISTING_STATUSES.includes(status)) {
    return null;
  }

  const filter = generateFilter({
    subdomain: scope.subdomain,
    agencyMemberId: scope.memberEntityId,
    searchValue,
    city,
    district,
    status: status || PUBLIC_LISTING_STATUS,
  });

  if (type) {
    filter.type = type;
  }

  if (propertyType) {
    filter.propertyType = propertyType;
  }

  return filter;
};

export const cpListingQueries = {
  cpGetBlockAdminAgencyListing: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const listing = await models.Listing.findOne({
      _id,
      status: { $in: PUBLIC_LISTING_STATUSES },
    }).lean();

    if (!listing) {
      throw new Error('Listing not found');
    }

    return listing;
  },

  cpGetBlockAdminAgencyListings: async (
    _root: undefined,
    params: CpListingQueryParams & IOffsetPaginateParams,
    { models }: IContext,
  ) => {
    const {
      page,
      perPage,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = params;

    const filter = await buildPublicFilter(models, params);

    if (!filter) {
      return [];
    }

    return await paginate(
      models.Listing.find(filter)
        .sort({ [sortField]: sortDirection })
        .lean(),
      { page, perPage },
    );
  },

  cpGetBlockAdminAgencyListingStats: async (
    _root: undefined,
    params: Pick<CpListingQueryParams, 'agencyId' | 'agencyMemberId'>,
    { models }: IContext,
  ) => {
    const scope = await resolveScope(models, params);

    if (!scope) {
      return EMPTY_LISTING_STATS;
    }

    const baseFilter = generateFilter({
      subdomain: scope.subdomain,
      agencyMemberId: scope.memberEntityId,
    });

    return await buildListingStats(models.Listing, baseFilter);
  },
};

markResolvers(cpListingQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});
