import { IBlockAdminListingDocument } from '@/listing/@types/listing';
import { IContext, IModels } from '~/connectionResolvers';

const findListingAgency = async (
  models: IModels,
  { subdomain }: IBlockAdminListingDocument,
) => {
  if (!subdomain) {
    return null;
  }

  return await models.Agency.findOne({ subdomain }).lean();
};

export default {
  agencyId: async (
    listing: IBlockAdminListingDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    const agency = await findListingAgency(models, listing);

    return agency?._id;
  },

  agency: async (
    listing: IBlockAdminListingDocument,
    _args: undefined,
    { models }: IContext,
  ) => await findListingAgency(models, listing),
};
