import { IOffsetPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import {
  ExpectedError,
  escapeRegExp,
  markResolvers,
  paginate,
} from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';

import { IProfileDocument } from '@/profile/@types/profile';
import { IContext } from '~/connectionResolvers';
import { PROFILE_STATUSES, REVIEW_STATUSES } from '~/constants';

export interface ICpProfileQueryParams {
  searchValue?: string;
  subdomain?: string;
  party?: string;
  district?: string;
  mandateType?: string;
  reviewStatus?: string;
}

const buildPublicFilter = (
  params: ICpProfileQueryParams,
): FilterQuery<IProfileDocument> | null => {
  const filter: FilterQuery<IProfileDocument> = {
    status: PROFILE_STATUSES.PUBLISHED,
  };

  if (params.searchValue) {
    const regex = new RegExp(escapeRegExp(params.searchValue), 'i');

    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { position: regex },
      { party: regex },
      { district: regex },
    ];
  }

  if (params.subdomain) {
    filter.subdomain = params.subdomain;
  }

  if (params.party) {
    filter.party = params.party;
  }

  if (params.district) {
    filter.district = params.district;
  }

  if (params.mandateType) {
    filter.mandateType = params.mandateType;
  }

  if (params.reviewStatus) {
    if (!REVIEW_STATUSES.ALL.includes(params.reviewStatus)) {
      return null;
    }

    filter.reviewStatus = params.reviewStatus;
  }

  return filter;
};

export const cpProfileQueries: Record<string, Resolver> = {
  async cpGetOroltsooProfiles(
    _root: undefined,
    params: ICpProfileQueryParams & IOffsetPaginateParams,
    { models }: IContext,
  ) {
    const {
      page,
      perPage,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = params;

    const filter = buildPublicFilter(params);

    if (!filter) {
      return [];
    }

    return paginate(
      models.Profile.find(filter)
        .sort({ [sortField]: sortDirection })
        .lean(),
      { page, perPage },
    );
  },

  async cpGetOroltsooProfile(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    const profile = await models.Profile.findOne({
      _id,
      status: PROFILE_STATUSES.PUBLISHED,
    }).lean();

    if (!profile) {
      throw new ExpectedError('Профайл олдсонгүй', 'NOT_FOUND');
    }

    return profile;
  },
};

markResolvers(cpProfileQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});
