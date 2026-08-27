import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate, escapeRegExp } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';

import {
  IProfileDocument,
  IProfileListParams,
} from '@/profile/@types/profile';
import { IContext } from '~/connectionResolvers';

const generateFilter = (params: IProfileListParams) => {
  const filter: FilterQuery<IProfileDocument> = {};

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

  if (params.reviewStatus) {
    filter.reviewStatus = params.reviewStatus;
  }

  if (params.party) {
    filter.party = params.party;
  }

  if (params.district) {
    filter.district = params.district;
  }

  if (params.syncedFrom || params.syncedTo) {
    filter.syncedAt = {
      ...(params.syncedFrom ? { $gte: new Date(params.syncedFrom) } : {}),
      ...(params.syncedTo ? { $lte: new Date(params.syncedTo) } : {}),
    };
  }

  return filter;
};

export const profileQueries: Record<string, Resolver> = {
  async oroltsooAdminProfiles(
    _root: undefined,
    params: IProfileListParams,
    { models }: IContext,
  ) {
    return cursorPaginate<IProfileDocument>({
      model: models.Profile,
      params,
      query: generateFilter(params),
    });
  },

  async oroltsooAdminProfileDetail(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Profile.getProfile(_id);
  },
};
