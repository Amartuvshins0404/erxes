import { FilterQuery, Model } from 'mongoose';
import { IBlockAdminListingDocument } from './@types/listing';

interface ListingQueryParams {
  subdomain?: string;
  status?: string;
  searchValue?: string;
  city?: string;
  district?: string;
  /** Agency-side member id, i.e. `BlockAdminAgent.entityId`. */
  agencyMemberId?: string;
}

export const generateFilter = (
  params: ListingQueryParams,
): FilterQuery<IBlockAdminListingDocument> => {
  const { subdomain, status, searchValue, city, district, agencyMemberId } =
    params;
  const filter: FilterQuery<IBlockAdminListingDocument> = {};

  if (subdomain) filter.subdomain = subdomain;
  if (status) filter.status = status;
  if (agencyMemberId) filter.agencyMemberId = agencyMemberId;
  if (searchValue) filter.title = { $regex: searchValue, $options: 'i' };
  if (city) filter['location.city'] = city;
  if (district) filter['location.district'] = district;

  return filter;
};

export interface IListingStats {
  total: number;
  active: number;
  draft: number;
  sold: number;
  totalViews: number;
}

export const EMPTY_LISTING_STATS: IListingStats = {
  total: 0,
  active: 0,
  draft: 0,
  sold: 0,
  totalViews: 0,
};

export const buildListingStats = async (
  model: Model<IBlockAdminListingDocument>,
  baseFilter: FilterQuery<IBlockAdminListingDocument>,
): Promise<IListingStats> => {
  const [total, active, draft, sold, viewsAgg] = await Promise.all([
    model.countDocuments(baseFilter),
    model.countDocuments({ ...baseFilter, status: 'active' }),
    model.countDocuments({ ...baseFilter, status: 'draft' }),
    model.countDocuments({ ...baseFilter, status: 'sold' }),
    model.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } },
    ]),
  ]);

  return {
    total,
    active,
    draft,
    sold,
    totalViews: viewsAgg[0]?.totalViews ?? 0,
  };
};
