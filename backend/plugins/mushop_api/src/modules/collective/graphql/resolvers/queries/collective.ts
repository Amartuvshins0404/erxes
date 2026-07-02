import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { CollectiveQueryParams } from '@/collective/@types/collective';
import { checkSubdomainAvailable } from '@/collective/utils/checkSubdomainAvailable';

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

  mushopCheckSubdomain: async (
    _root: undefined,
    { subdomain }: { subdomain?: string },
  ) => {
    if (!subdomain?.trim()) return null;

    return checkSubdomainAvailable(subdomain.trim());
  },
};

markResolvers(collectiveQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
