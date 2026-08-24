import {
  checkLogin,
  checkPermissionGroup,
} from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { ensureTenantAgency } from '~/modules/agency/utils';

export const blockAgencyQueries = {
  getAgencyInfo: async (
    _root: undefined,
    _args: unknown,
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('agencyRead');

    return ensureTenantAgency(models, subdomain);
  },

  getAgencyVerificationStatus: async (
    _root: undefined,
    _args: unknown,
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('agencyRead');

    return models.BlockAgency.findOne({});
  },
};
