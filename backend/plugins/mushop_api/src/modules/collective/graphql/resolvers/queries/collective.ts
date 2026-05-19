import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { CollectiveQueryParams } from '@/collective/@types/collective';

export const collectiveQueries = {
  mushopCollectiveDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Collective.getCollective(_id);
  },

  mushopCollectives: async (
    _root: undefined,
    params: CollectiveQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    return models.Collective.listCollectives(params);
  },
};

markResolvers(collectiveQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
