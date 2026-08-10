import { IBlockAdminListingDocument } from '@/listing/@types/listing';
import { generateFilter } from '@/listing/utils';
import { IOffsetPaginateParams } from 'erxes-api-shared/core-types';
import { markResolvers, paginate } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';
import { IContext, IModels } from '~/connectionResolvers';

/**
 * The client portal only ever sees published listings; drafts, inactive and
 * sold records stay admin-side.
 */
const PUBLIC_LISTING_STATUS = 'active';

export interface CpListingQueryParams {
  agencyId?: string;
  type?: string;
  propertyType?: string;
  searchValue?: string;
  city?: string;
  district?: string;
}

/**
 * Listings are keyed to their agency by `subdomain`, so a client-portal
 * `agencyId` has to be resolved to one first. Returns `undefined` when the
 * agency does not exist, which callers must treat as "no listings" rather than
 * as "no filter".
 */
const resolveAgencySubdomain = async (models: IModels, agencyId: string) => {
  const agency = await models.Agency.findOne({ _id: agencyId })
    .select('subdomain')
    .lean();

  return agency?.subdomain;
};

const buildPublicFilter = async (
  models: IModels,
  { agencyId, type, propertyType, searchValue, city, district }: CpListingQueryParams,
): Promise<FilterQuery<IBlockAdminListingDocument> | null> => {
  let subdomain: string | undefined;

  if (agencyId) {
    subdomain = await resolveAgencySubdomain(models, agencyId);

    if (!subdomain) {
      return null;
    }
  }

  const filter = generateFilter({
    subdomain,
    searchValue,
    city,
    district,
    status: PUBLIC_LISTING_STATUS,
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
  cpGetBlockAdminListing: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const listing = await models.Listing.findOne({
      _id,
      status: PUBLIC_LISTING_STATUS,
    }).lean();

    if (!listing) {
      throw new Error('Listing not found');
    }

    return listing;
  },

  cpGetBlockAdminListings: async (
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

  cpGetBlockAdminListingStats: async (
    _root: undefined,
    { agencyId }: { agencyId?: string },
    { models }: IContext,
  ) => {
    const baseFilter: FilterQuery<IBlockAdminListingDocument> = {};

    if (agencyId) {
      const subdomain = await resolveAgencySubdomain(models, agencyId);

      if (!subdomain) {
        return { total: 0, active: 0, draft: 0, totalViews: 0 };
      }

      baseFilter.subdomain = subdomain;
    }

    const [total, active, draft, viewsAgg] = await Promise.all([
      models.Listing.countDocuments(baseFilter),
      models.Listing.countDocuments({ ...baseFilter, status: 'active' }),
      models.Listing.countDocuments({ ...baseFilter, status: 'draft' }),
      models.Listing.aggregate<{ totalViews: number }>([
        { $match: baseFilter },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } },
      ]),
    ]);

    return {
      total,
      active,
      draft,
      totalViews: viewsAgg[0]?.totalViews ?? 0,
    };
  },
};

markResolvers(cpListingQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});
