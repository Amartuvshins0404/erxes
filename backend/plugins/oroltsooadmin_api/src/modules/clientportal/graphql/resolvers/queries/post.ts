import { IOffsetPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import {
  ExpectedError,
  escapeRegExp,
  markResolvers,
  paginate,
} from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';

import { IPostDocument } from '@/post/@types/post';
import { IContext, IModels } from '~/connectionResolvers';
import { POST_STATUSES, PROFILE_STATUSES } from '~/constants';

export interface ICpPostQueryParams {
  searchValue?: string;
  subdomain?: string;
  profileId?: string;
  tag?: string;
  publishedFrom?: Date;
  publishedTo?: Date;
}

const buildPublicFilter = async (
  models: IModels,
  params: ICpPostQueryParams,
): Promise<FilterQuery<IPostDocument> | null> => {
  const filter: FilterQuery<IPostDocument> = {
    status: POST_STATUSES.PUBLISHED,
  };

  if (params.profileId) {
    const profile = await models.Profile.findOne({
      _id: params.profileId,
      status: PROFILE_STATUSES.PUBLISHED,
    })
      .select('subdomain')
      .lean();

    if (!profile || (params.subdomain && params.subdomain !== profile.subdomain)) {
      return null;
    }

    filter.subdomain = profile.subdomain;
  } else if (params.subdomain) {
    filter.subdomain = params.subdomain;
  }

  if (params.searchValue) {
    const regex = new RegExp(escapeRegExp(params.searchValue), 'i');

    filter.$or = [{ title: regex }, { excerpt: regex }, { tags: regex }];
  }

  if (params.tag) {
    filter.tags = params.tag;
  }

  if (params.publishedFrom || params.publishedTo) {
    filter.publishedAt = {
      ...(params.publishedFrom ? { $gte: new Date(params.publishedFrom) } : {}),
      ...(params.publishedTo ? { $lte: new Date(params.publishedTo) } : {}),
    };
  }

  return filter;
};

export const cpPostQueries: Record<string, Resolver> = {
  async cpGetOroltsooPosts(
    _root: undefined,
    params: ICpPostQueryParams & IOffsetPaginateParams,
    { models }: IContext,
  ) {
    const {
      page,
      perPage,
      sortField = 'publishedAt',
      sortDirection = 'desc',
    } = params;

    const filter = await buildPublicFilter(models, params);

    if (!filter) {
      return [];
    }

    return paginate(
      models.Post.find(filter)
        .sort({ [sortField]: sortDirection })
        .lean(),
      { page, perPage },
    );
  },

  async cpGetOroltsooPost(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    const post = await models.Post.findOne({
      _id,
      status: POST_STATUSES.PUBLISHED,
    }).lean();

    if (!post) {
      throw new ExpectedError('Пост олдсонгүй', 'NOT_FOUND');
    }

    return post;
  },
};

markResolvers(cpPostQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});
