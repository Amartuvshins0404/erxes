import { IOffsetPaginateParams } from 'erxes-api-shared/core-types';
import { markResolvers, paginate } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { DeveloperQueryParams } from '~/modules/developer/db/@types/developer';
import { generateFilter } from '~/modules/developer/utils';

export const cpDeveloperQueries = {
  cpBlockAdminDeveloperInfo: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return await models.Developer.findOne({ _id, visibility: 'public' }).lean();
  },
  cpBlockAdminDevelopers: async (
    _root: undefined,
    params: DeveloperQueryParams & IOffsetPaginateParams,
    { models }: IContext,
  ) => {
    const {
      page,
      perPage,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = params;

    const filter = await generateFilter(params);

    return await paginate(
      models.Developer.find({ ...filter, visibility: 'public' }).sort({ [sortField]: sortDirection }),
      { page, perPage },
    );
  },
};

markResolvers(cpDeveloperQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});
