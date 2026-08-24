import { checkLogin } from 'erxes-api-shared/core-modules';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import {
  IBlockListingDocument,
  ListingQueryParams,
} from '~/modules/listing/@types/listing';
import { generateFilter } from '~/modules/listing/utils';

export const blockListingQueries = {
  blockGetListing: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    return models.BlockListing.getListing(_id);
  },

  blockGetListings: async (
    _root: undefined,
    params: ListingQueryParams & ICursorPaginateParams,
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    const filter = await generateFilter(params);

    const { list, pageInfo, totalCount } =
      await cursorPaginate<IBlockListingDocument>({
        model: models.BlockListing,
        params,
        query: filter,
      });

    return { list, pageInfo, totalCount };
  },

  blockGetListingStats: async (
    _root: undefined,
    _args: unknown,
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    const [total, active, draft, viewsAgg] = await Promise.all([
      models.BlockListing.countDocuments({}),
      models.BlockListing.countDocuments({ status: 'active' }),
      models.BlockListing.countDocuments({ status: 'draft' }),
      models.BlockListing.aggregate([
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
