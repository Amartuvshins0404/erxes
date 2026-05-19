import { IContext } from '~/connectionResolvers';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { CollectivePackageQueryParams } from '@/collective-package/@types/collectivePackage';
import { markResolvers } from 'erxes-api-shared/utils';

export const collectivePackageQueries = {
  mushopCollectivePackageDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.CollectivePackage.getCollectivePackage(_id);
  },

  mushopCollectivePackages: async (
    _root: undefined,
    params: CollectivePackageQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) => {
    return models.CollectivePackage.listCollectivePackages(params);
  },
};

markResolvers(collectivePackageQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
