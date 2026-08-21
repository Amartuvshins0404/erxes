import { IContext } from '~/connectionResolvers';
import { IBlockAgency } from '~/modules/agency/@types/agency';
import { ensureTenantAgency } from '~/modules/agency/utils';

export const blockAgencyMutations = {
  updateAgencyInfo: async (
    _root: undefined,
    { input }: { input: IBlockAgency },
    { models, subdomain }: IContext,
  ) => {
    // Creating the agency here also seeds the tenant's owners as its admins,
    // so every creation path goes through `ensureTenantAgency`.
    const agency = await ensureTenantAgency(models, subdomain);

    return models.BlockAgency.updateAgency(String(agency._id), input);
  },
};
