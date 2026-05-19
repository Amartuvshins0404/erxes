import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { requestMessage } from '~/modules/admin/utils';

export const collectiveQueries = {
  getCollective: async (_root: undefined, _args: any, { models }: IContext) => {
    return models.Collective.getCollective();
  },

  collectiveDetail: async (
    _root: undefined,
    _args: { _id: string },
    { models }: IContext,
  ) => {
    return models.Collective.getCollective();
  },

  collectiveSuppliers: async (
    _root: undefined,
    _args: any,
    { subdomain }: IContext,
  ) => {
    const result = await requestMessage<{
      collective: any;
      suppliers: any[];
    }>({
      subdomain,
      path: 'collective/members',
      platform: 'mushop',
      payload: { data: { targetSubdomain: subdomain } },
    });

    const suppliers = result?.suppliers || [];

    return suppliers.map((s: any) => ({
      _id: s._id,
      name: s.name,
      logo: s.logo,
      primaryEmail: s.primaryEmail,
      primaryPhone: s.primaryPhone,
      verificationStatus: s.verificationStatus,
    }));
  },

  collectivePackages: async (
    _root: undefined,
    args: Record<string, any>,
    { subdomain }: IContext,
  ) => {
    const result = await requestMessage<{
      list?: any[];
      pageInfo?: any;
      totalCount?: number;
      error?: string;
    }>({
      subdomain,
      path: 'collective-package/list',
      platform: 'mushop',
      payload: { data: { targetSubdomain: subdomain, ...args } },
    });

    return {
      list: result?.list || [],
      pageInfo: result?.pageInfo || null,
      totalCount: result?.totalCount || 0,
    };
  },

  collectivePackageDetail: async (
    _root: undefined,
    { _id }: { _id: string },
    { subdomain }: IContext,
  ) => {
    const result = await requestMessage<{
      package?: any;
      error?: string;
    }>({
      subdomain,
      path: 'collective-package/detail',
      platform: 'mushop',
      payload: { data: { targetSubdomain: subdomain, _id } },
    });

    return result?.package || null;
  },
};

markResolvers(collectiveQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
