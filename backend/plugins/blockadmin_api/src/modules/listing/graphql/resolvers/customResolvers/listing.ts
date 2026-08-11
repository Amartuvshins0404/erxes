import { IContext } from '~/connectionResolvers';
import { IBlockAdminListingDocument } from '@/listing/@types/listing';

export default {
  agencyId: async (
    { subdomain }: IBlockAdminListingDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    const agency = await models.Agency.findOne({ subdomain }).lean();

    return agency?._id;
  },
};
