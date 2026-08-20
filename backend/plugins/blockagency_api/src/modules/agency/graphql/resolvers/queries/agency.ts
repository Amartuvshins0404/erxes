import { IContext } from '~/connectionResolvers';
import { ensureTenantAgency } from '~/modules/agency/utils';

export const blockAgencyQueries = {
  // `ensureTenantAgency` keeps the read lean, so legacy string attachments stay
  // readable and are normalized by the BlockAgency custom resolvers.
  getAgencyInfo: async (_root: undefined, _args: unknown, { models, subdomain }: IContext) =>
    ensureTenantAgency(models, subdomain),

  getAgencyVerificationStatus: async (
    _root: undefined,
    _args: unknown,
    { models }: IContext,
  ) => {
    const agencyVerificationStatus = await models.BlockAgency.findOne({});

    return agencyVerificationStatus;
  },
};
