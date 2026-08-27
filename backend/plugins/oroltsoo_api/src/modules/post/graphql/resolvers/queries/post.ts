import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate, escapeRegExp } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';

import { IPostDocument, IPostListParams } from '@/post/@types/post';
import { IContext } from '~/connectionResolvers';

const generateFilter = (params: IPostListParams) => {
  const filter: FilterQuery<IPostDocument> = {};

  if (params.searchValue) {
    const regex = new RegExp(escapeRegExp(params.searchValue), 'i');

    filter.$or = [{ title: regex }, { excerpt: regex }, { tags: regex }];
  }

  if (params.status) {
    filter.status = params.status;
  }

  if (params.tag) {
    filter.tags = params.tag;
  }

  if (params.publishedFrom || params.publishedTo) {
    filter.publishedAt = {
      ...(params.publishedFrom
        ? { $gte: new Date(params.publishedFrom) }
        : {}),
      ...(params.publishedTo ? { $lte: new Date(params.publishedTo) } : {}),
    };
  }

  return filter;
};

export const postQueries: Record<string, Resolver> = {
  async oroltsooPosts(
    _root: undefined,
    params: IPostListParams,
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('showOroltsooPosts');

    return cursorPaginate<IPostDocument>({
      model: models.Post,
      params: { orderBy: { createdAt: -1 }, ...params },
      query: generateFilter(params),
    });
  },

  async oroltsooPostDetail(
    _root: undefined,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('showOroltsooPosts');

    return models.Post.getPost(_id);
  },
};
