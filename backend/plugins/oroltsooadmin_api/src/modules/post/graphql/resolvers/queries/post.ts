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

  if (params.subdomain) {
    filter.subdomain = params.subdomain;
  }

  if (params.status) {
    filter.status = params.status;
  }

  if (params.tag) {
    filter.tags = params.tag;
  }

  return filter;
};

export const postQueries: Record<string, Resolver> = {
  async oroltsooAdminPosts(
    _root: undefined,
    params: IPostListParams,
    { models }: IContext,
  ) {
    return cursorPaginate<IPostDocument>({
      model: models.Post,
      params: { orderBy: { publishedAt: -1 }, ...params },
      query: generateFilter(params),
    });
  },

  async oroltsooAdminPostDetail(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Post.getPost(_id);
  },
};
